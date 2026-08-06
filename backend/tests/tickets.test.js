const request = require('supertest');
const app = require('../src/app');
const { resetarBanco, criarUsuario } = require('./helpers');

async function login(email, senha = 'senha123') {
  const res = await request(app).post('/api/auth/login').send({ email, senha });
  return res.body.token;
}

let cliente1;
let cliente2;
let atendente1;
let admin;
let tokenCliente1;
let tokenCliente2;
let tokenAtendente1;
let tokenAdmin;

beforeEach(async () => {
  await resetarBanco();
  cliente1 = await criarUsuario({ nome: 'Cliente 1', email: 'c1@teste.com', papel: 'CLIENTE' });
  cliente2 = await criarUsuario({ nome: 'Cliente 2', email: 'c2@teste.com', papel: 'CLIENTE' });
  atendente1 = await criarUsuario({ nome: 'Atendente 1', email: 'a1@teste.com', papel: 'ATENDENTE' });
  admin = await criarUsuario({ nome: 'Admin', email: 'admin@teste.com', papel: 'ADMIN' });

  tokenCliente1 = await login(cliente1.email);
  tokenCliente2 = await login(cliente2.email);
  tokenAtendente1 = await login(atendente1.email);
  tokenAdmin = await login(admin.email);
});

describe('POST /api/tickets', () => {
  it('cliente cria um chamado e ele é atribuído automaticamente ao único atendente ativo', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ titulo: 'Problema no sistema', descricao: 'Descrição com mais de dez caracteres', prioridade: 'ALTA' });

    expect(res.status).toBe(201);
    expect(res.body.ticket.status).toBe('ABERTO');
    expect(res.body.ticket.atendenteId).toBe(atendente1.id);
  });

  it('atendente e admin não podem abrir chamado (só cliente relata o próprio problema)', async () => {
    const resAtendente = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenAtendente1}`)
      .send({ titulo: 'Teste', descricao: 'Descrição válida aqui', prioridade: 'BAIXA' });
    expect(resAtendente.status).toBe(403);

    const resAdmin = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ titulo: 'Teste', descricao: 'Descrição válida aqui', prioridade: 'BAIXA' });
    expect(resAdmin.status).toBe(403);
  });

  it('rejeita descrição curta com 400', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ titulo: 'Teste', descricao: 'curta', prioridade: 'BAIXA' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/tickets — escopo de visibilidade por papel', () => {
  it('cliente só vê os próprios chamados', async () => {
    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ titulo: 'Chamado do cliente 1', descricao: 'Descrição válida aqui', prioridade: 'MEDIA' });
    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenCliente2}`)
      .send({ titulo: 'Chamado do cliente 2', descricao: 'Descrição válida aqui', prioridade: 'MEDIA' });

    const res = await request(app).get('/api/tickets').set('Authorization', `Bearer ${tokenCliente1}`);

    expect(res.status).toBe(200);
    expect(res.body.tickets).toHaveLength(1);
    expect(res.body.tickets[0].titulo).toBe('Chamado do cliente 1');
  });

  it('atendente e admin veem todos os chamados', async () => {
    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ titulo: 'Chamado A', descricao: 'Descrição válida aqui', prioridade: 'MEDIA' });
    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenCliente2}`)
      .send({ titulo: 'Chamado B', descricao: 'Descrição válida aqui', prioridade: 'MEDIA' });

    const resAtendente = await request(app).get('/api/tickets').set('Authorization', `Bearer ${tokenAtendente1}`);
    expect(resAtendente.body.tickets).toHaveLength(2);

    const resAdmin = await request(app).get('/api/tickets').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(resAdmin.body.tickets).toHaveLength(2);
  });

  it('filtra por prioridade via query string', async () => {
    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ titulo: 'Alta', descricao: 'Descrição válida aqui', prioridade: 'ALTA' });
    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ titulo: 'Baixa', descricao: 'Descrição válida aqui', prioridade: 'BAIXA' });

    const res = await request(app)
      .get('/api/tickets?prioridade=ALTA')
      .set('Authorization', `Bearer ${tokenCliente1}`);

    expect(res.body.tickets).toHaveLength(1);
    expect(res.body.tickets[0].titulo).toBe('Alta');
  });
});

describe('GET /api/tickets/:id — isolamento entre clientes', () => {
  it('cliente que não é dono recebe 404 (não 403 — não revela que o chamado existe)', async () => {
    const criado = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ titulo: 'Privado', descricao: 'Descrição válida aqui', prioridade: 'MEDIA' });

    const res = await request(app)
      .get(`/api/tickets/${criado.body.ticket.id}`)
      .set('Authorization', `Bearer ${tokenCliente2}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/tickets/:id/status — transições do Kanban', () => {
  async function criarTicket() {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ titulo: 'Ticket', descricao: 'Descrição válida aqui', prioridade: 'MEDIA' });
    return res.body.ticket;
  }

  it('cliente não pode alterar status', async () => {
    const ticket = await criarTicket();
    const res = await request(app)
      .patch(`/api/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ status: 'EM_ATENDIMENTO' });
    expect(res.status).toBe(403);
  });

  it('atendente não atribuído ao chamado não pode movê-lo', async () => {
    const ticket = await criarTicket();
    const outroAtendente = await criarUsuario({ nome: 'Outro', email: 'a2@teste.com', papel: 'ATENDENTE' });
    const tokenOutro = await login(outroAtendente.email);

    const res = await request(app)
      .patch(`/api/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${tokenOutro}`)
      .send({ status: 'EM_ATENDIMENTO' });
    expect(res.status).toBe(403);
  });

  it('não permite pular direto de ABERTO para FECHADO', async () => {
    const ticket = await criarTicket();
    const res = await request(app)
      .patch(`/api/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${tokenAtendente1}`)
      .send({ status: 'FECHADO' });
    expect(res.status).toBe(409);
  });

  it('atendente atribuído move ABERTO -> EM_ATENDIMENTO -> FECHADO, e fechadoEm é registrado', async () => {
    const ticket = await criarTicket();

    const emAtendimento = await request(app)
      .patch(`/api/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${tokenAtendente1}`)
      .send({ status: 'EM_ATENDIMENTO' });
    expect(emAtendimento.status).toBe(200);
    expect(emAtendimento.body.ticket.status).toBe('EM_ATENDIMENTO');

    const fechado = await request(app)
      .patch(`/api/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${tokenAtendente1}`)
      .send({ status: 'FECHADO' });
    expect(fechado.status).toBe(200);
    expect(fechado.body.ticket.status).toBe('FECHADO');
    expect(fechado.body.ticket.fechadoEm).toBeTruthy();
  });

  it('admin pode mover qualquer chamado, mesmo não sendo o atendente responsável', async () => {
    const ticket = await criarTicket();
    const res = await request(app)
      .patch(`/api/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'EM_ATENDIMENTO' });
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/tickets/:id — só admin exclui', () => {
  it('atendente recebe 403 ao tentar excluir', async () => {
    const criado = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ titulo: 'Ticket', descricao: 'Descrição válida aqui', prioridade: 'MEDIA' });

    const res = await request(app)
      .delete(`/api/tickets/${criado.body.ticket.id}`)
      .set('Authorization', `Bearer ${tokenAtendente1}`);
    expect(res.status).toBe(403);
  });

  it('admin exclui com sucesso', async () => {
    const criado = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ titulo: 'Ticket', descricao: 'Descrição válida aqui', prioridade: 'MEDIA' });

    const res = await request(app)
      .delete(`/api/tickets/${criado.body.ticket.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(204);
  });
});

describe('POST /api/tickets/:id/comentarios', () => {
  it('cliente dono comenta no próprio chamado', async () => {
    const criado = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ titulo: 'Ticket', descricao: 'Descrição válida aqui', prioridade: 'MEDIA' });

    const res = await request(app)
      .post(`/api/tickets/${criado.body.ticket.id}/comentarios`)
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ mensagem: 'Alguma novidade?' });

    expect(res.status).toBe(201);
    expect(res.body.comentario.mensagem).toBe('Alguma novidade?');
  });

  it('cliente que não é dono não pode comentar (404, chamado nem aparece pra ele)', async () => {
    const criado = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenCliente1}`)
      .send({ titulo: 'Ticket', descricao: 'Descrição válida aqui', prioridade: 'MEDIA' });

    const res = await request(app)
      .post(`/api/tickets/${criado.body.ticket.id}/comentarios`)
      .set('Authorization', `Bearer ${tokenCliente2}`)
      .send({ mensagem: 'Intrometido' });

    expect(res.status).toBe(404);
  });
});
