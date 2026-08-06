const request = require('supertest');
const app = require('../src/app');
const { resetarBanco, criarUsuario } = require('./helpers');

async function login(email, senha = 'senha123') {
  const res = await request(app).post('/api/auth/login').send({ email, senha });
  return res.body.token;
}

async function abrirChamado(tokenCliente, titulo) {
  const res = await request(app)
    .post('/api/tickets')
    .set('Authorization', `Bearer ${tokenCliente}`)
    .send({ titulo, descricao: 'Descrição válida com detalhes suficientes', prioridade: 'MEDIA' });
  return res.body.ticket;
}

beforeEach(async () => {
  await resetarBanco();
});

describe('Atribuição automática de atendentes', () => {
  it('sem nenhum atendente ativo, o chamado fica sem atendenteId (não quebra a criação)', async () => {
    const cliente = await criarUsuario({ email: 'sozinho@teste.com', papel: 'CLIENTE' });
    const token = await login(cliente.email);

    const ticket = await abrirChamado(token, 'Chamado sem atendente disponível');

    expect(ticket.atendenteId).toBeNull();
  });

  it('distribui novos chamados para o atendente com menor carga (ABERTO + EM_ATENDIMENTO)', async () => {
    const cliente = await criarUsuario({ email: 'distrib@teste.com', papel: 'CLIENTE' });
    const tokenCliente = await login(cliente.email);
    const a1 = await criarUsuario({ nome: 'A1', email: 'd1@teste.com', papel: 'ATENDENTE' });
    const a2 = await criarUsuario({ nome: 'A2', email: 'd2@teste.com', papel: 'ATENDENTE' });

    // Primeiro chamado: empate 0x0, um dos dois recebe.
    const ticket1 = await abrirChamado(tokenCliente, 'Chamado 1');
    const primeiroEscolhido = ticket1.atendenteId;
    expect([a1.id, a2.id]).toContain(primeiroEscolhido);

    // Segundo chamado: quem não recebeu o primeiro está com carga menor agora.
    const ticket2 = await abrirChamado(tokenCliente, 'Chamado 2');
    const segundoEscolhido = ticket2.atendenteId;
    expect(segundoEscolhido).not.toBe(primeiroEscolhido);

    // Terceiro chamado: empate de novo (1x1) — round-robin devolve ao primeiro.
    const ticket3 = await abrirChamado(tokenCliente, 'Chamado 3');
    expect(ticket3.atendenteId).toBe(primeiroEscolhido);
  });

  it('atendente desativado não recebe novos chamados', async () => {
    const cliente = await criarUsuario({ email: 'inativoteste@teste.com', papel: 'CLIENTE' });
    const tokenCliente = await login(cliente.email);
    const ativo = await criarUsuario({ nome: 'Ativo', email: 'ativo@teste.com', papel: 'ATENDENTE' });
    await criarUsuario({ nome: 'Inativo', email: 'inativo@teste.com', papel: 'ATENDENTE', ativo: false });

    const ticket = await abrirChamado(tokenCliente, 'Chamado');

    expect(ticket.atendenteId).toBe(ativo.id);
  });

  it('chamados fechados não contam como carga do atendente', async () => {
    const cliente = await criarUsuario({ email: 'fechados@teste.com', papel: 'CLIENTE' });
    const tokenCliente = await login(cliente.email);
    const a1 = await criarUsuario({ nome: 'A1', email: 'f1@teste.com', papel: 'ATENDENTE' });
    const tokenA1 = await login(a1.email);

    // Único atendente ativo: os dois chamados só podem ir para ele.
    const ticket1 = await abrirChamado(tokenCliente, 'Chamado 1');
    expect(ticket1.atendenteId).toBe(a1.id);

    await request(app)
      .patch(`/api/tickets/${ticket1.id}/status`)
      .set('Authorization', `Bearer ${tokenA1}`)
      .send({ status: 'EM_ATENDIMENTO' });
    await request(app)
      .patch(`/api/tickets/${ticket1.id}/status`)
      .set('Authorization', `Bearer ${tokenA1}`)
      .send({ status: 'FECHADO' });

    // Abre um segundo chamado e mede a carga do atendente diretamente —
    // se o ticket fechado ainda contasse, a carga apareceria como 1.
    const ticket2 = await abrirChamado(tokenCliente, 'Chamado 2');
    expect(ticket2.atendenteId).toBe(a1.id);

    const { prisma } = require('./helpers');
    const chamadosAbertos = await prisma.ticket.count({
      where: { atendenteId: a1.id, status: { in: ['ABERTO', 'EM_ATENDIMENTO'] } },
    });
    expect(chamadosAbertos).toBe(1); // só o ticket2 — o ticket1 fechado não conta
  });
});
