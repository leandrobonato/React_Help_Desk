const prisma = require('../lib/prisma');
const { PAPEIS, STATUS_TICKET } = require('../utils/constantes');

// Atribuição automática por "menor carga": entre os atendentes ativos,
// escolhe quem tem menos chamados em aberto (ABERTO + EM_ATENDIMENTO).
// Empate é resolvido por quem está há mais tempo sem receber um chamado
// novo (round-robin implícito), usando o createdAt do último ticket
// atribuído como critério — evita que o "primeiro" atendente do banco
// sempre vença o empate.
async function escolherAtendenteMenosOcupado() {
  const atendentesAtivos = await prisma.usuario.findMany({
    where: { papel: PAPEIS.ATENDENTE, ativo: true },
    select: {
      id: true,
      nome: true,
      email: true,
      ticketsComoAtendente: {
        where: { status: { in: [STATUS_TICKET.ABERTO, STATUS_TICKET.EM_ATENDIMENTO] } },
        select: { id: true },
      },
    },
  });

  if (atendentesAtivos.length === 0) {
    return null;
  }

  const ultimasAtribuicoes = await prisma.ticket.groupBy({
    by: ['atendenteId'],
    where: { atendenteId: { not: null } },
    _max: { createdAt: true },
  });
  const ultimaAtribuicaoPorAtendente = new Map(
    ultimasAtribuicoes.map((item) => [item.atendenteId, item._max.createdAt]),
  );

  const candidatos = atendentesAtivos.map((atendente) => ({
    atendente,
    cargaAtual: atendente.ticketsComoAtendente.length,
    ultimaAtribuicao: ultimaAtribuicaoPorAtendente.get(atendente.id) || new Date(0),
  }));

  candidatos.sort((a, b) => {
    if (a.cargaAtual !== b.cargaAtual) return a.cargaAtual - b.cargaAtual;
    return a.ultimaAtribuicao - b.ultimaAtribuicao;
  });

  return candidatos[0].atendente;
}

module.exports = { escolherAtendenteMenosOcupado };
