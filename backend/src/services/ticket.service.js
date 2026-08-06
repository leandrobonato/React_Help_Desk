const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const { PAPEIS, STATUS_TICKET, TRANSICOES_STATUS } = require('../utils/constantes');
const { escolherAtendenteMenosOcupado } = require('./atribuicao.service');
const { notificarNovoChamado } = require('./email.service');

const INCLUDE_PADRAO = {
  cliente: { select: { id: true, nome: true, email: true } },
  atendente: { select: { id: true, nome: true, email: true } },
};

// Regra de visibilidade central: cliente só vê os próprios chamados;
// atendente e admin veem todos (o atendente precisa ver a fila inteira
// para o Kanban fazer sentido, não só os já atribuídos a ele).
function escopoPorUsuario(usuario) {
  if (usuario.papel === PAPEIS.CLIENTE) {
    return { clienteId: usuario.id };
  }
  return {};
}

async function listar(usuario, filtros = {}) {
  const where = {
    ...escopoPorUsuario(usuario),
    ...(filtros.status ? { status: filtros.status } : {}),
    ...(filtros.prioridade ? { prioridade: filtros.prioridade } : {}),
  };

  return prisma.ticket.findMany({
    where,
    include: INCLUDE_PADRAO,
    orderBy: [{ prioridade: 'desc' }, { createdAt: 'asc' }],
  });
}

async function buscarPorId(usuario, id) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { ...INCLUDE_PADRAO, comentarios: { include: { autor: { select: { id: true, nome: true, papel: true } } }, orderBy: { createdAt: 'asc' } } },
  });

  if (!ticket) throw new AppError('Chamado não encontrado', 404);

  if (usuario.papel === PAPEIS.CLIENTE && ticket.clienteId !== usuario.id) {
    // 404 em vez de 403: não confirma para o cliente que o ID existe.
    throw new AppError('Chamado não encontrado', 404);
  }

  return ticket;
}

async function criar(cliente, dados) {
  const atendente = await escolherAtendenteMenosOcupado();

  const ticket = await prisma.$transaction(async (tx) => {
    const novoTicket = await tx.ticket.create({
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao,
        prioridade: dados.prioridade,
        clienteId: cliente.id,
        atendenteId: atendente?.id ?? null,
      },
      include: INCLUDE_PADRAO,
    });

    await tx.historicoTicket.create({
      data: { ticketId: novoTicket.id, tipo: 'CRIADO', valorNovo: STATUS_TICKET.ABERTO, autorId: cliente.id },
    });

    if (atendente) {
      await tx.historicoTicket.create({
        data: { ticketId: novoTicket.id, tipo: 'ATRIBUIDO', valorNovo: atendente.id, autorId: null },
      });
    }

    return novoTicket;
  });

  // E-mail é best-effort: uma falha de SMTP não pode derrubar a criação
  // do chamado, que já está persistida e é o efeito que importa de verdade.
  try {
    await notificarNovoChamado({ ticket, cliente, atendente });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Falha ao enviar e-mail de notificação:', err.message);
  }

  return ticket;
}

// Quem pode mover para onde no Kanban:
// - cliente nunca move um chamado;
// - atendente move chamados atribuídos a ele mesmo;
// - admin move qualquer chamado (controle total, mas a transição em si
//   continua obedecendo TRANSICOES_STATUS — nem admin pula etapa).
async function atualizarStatus(usuario, id, novoStatus) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw new AppError('Chamado não encontrado', 404);

  if (usuario.papel === PAPEIS.CLIENTE) {
    throw new AppError('Clientes não podem alterar o status de um chamado', 403);
  }
  if (usuario.papel === PAPEIS.ATENDENTE && ticket.atendenteId !== usuario.id) {
    throw new AppError('Você só pode mover chamados atribuídos a você', 403);
  }

  const transicoesValidas = TRANSICOES_STATUS[ticket.status] || [];
  if (!transicoesValidas.includes(novoStatus)) {
    throw new AppError(`Não é possível mover de ${ticket.status} para ${novoStatus}`, 409);
  }

  const atualizado = await prisma.$transaction(async (tx) => {
    const resultado = await tx.ticket.update({
      where: { id },
      data: {
        status: novoStatus,
        fechadoEm: novoStatus === STATUS_TICKET.FECHADO ? new Date() : null,
      },
      include: INCLUDE_PADRAO,
    });

    await tx.historicoTicket.create({
      data: {
        ticketId: id,
        tipo: 'STATUS_ALTERADO',
        valorAnterior: ticket.status,
        valorNovo: novoStatus,
        autorId: usuario.id,
      },
    });

    return resultado;
  });

  return atualizado;
}

// Reatribuição manual — só admin (controle total sobre o roteamento).
async function reatribuir(usuario, id, atendenteId) {
  if (usuario.papel !== PAPEIS.ADMIN) {
    throw new AppError('Só administradores podem reatribuir chamados', 403);
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw new AppError('Chamado não encontrado', 404);

  const novoAtendente = await prisma.usuario.findUnique({ where: { id: atendenteId } });
  if (!novoAtendente || novoAtendente.papel !== PAPEIS.ATENDENTE) {
    throw new AppError('Atendente inválido', 400);
  }

  const atualizado = await prisma.$transaction(async (tx) => {
    const resultado = await tx.ticket.update({
      where: { id },
      data: { atendenteId },
      include: INCLUDE_PADRAO,
    });

    await tx.historicoTicket.create({
      data: {
        ticketId: id,
        tipo: 'REATRIBUIDO',
        valorAnterior: ticket.atendenteId,
        valorNovo: atendenteId,
        autorId: usuario.id,
      },
    });

    return resultado;
  });

  return atualizado;
}

// "Atendente não deleta" — nem sequer existe uma função de exclusão de
// chamado no service; só admin, e com cópia do estado preservada no
// histórico (a trilha HistoricoTicket não é apagada em cascade lógico —
// só o Ticket referenciado some fisicamente, mas cada evento já registrado
// permanece até o Ticket ser removido, quando cai junto por FK cascade).
async function excluir(usuario, id) {
  if (usuario.papel !== PAPEIS.ADMIN) {
    throw new AppError('Só administradores podem excluir chamados', 403);
  }
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw new AppError('Chamado não encontrado', 404);

  await prisma.ticket.delete({ where: { id } });
}

async function adicionarComentario(usuario, id, mensagem) {
  const ticket = await buscarPorId(usuario, id);

  return prisma.comentario.create({
    data: { ticketId: ticket.id, autorId: usuario.id, mensagem },
    include: { autor: { select: { id: true, nome: true, papel: true } } },
  });
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizarStatus,
  reatribuir,
  excluir,
  adicionarComentario,
};
