const request = require('supertest');
const app = require('../src/app');
const { resetarBanco, criarUsuario } = require('./helpers');

beforeEach(async () => {
  await resetarBanco();
});

describe('POST /api/auth/registro', () => {
  it('cria uma conta sempre como CLIENTE, mesmo se o body tentar enviar outro papel', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nome: 'Fulano', email: 'fulano@teste.com', senha: 'senha123', papel: 'ADMIN' });

    expect(res.status).toBe(201);
    expect(res.body.usuario.papel).toBe('CLIENTE');
    expect(res.body.token).toBeTruthy();
  });

  it('rejeita e-mail duplicado com 409', async () => {
    await criarUsuario({ email: 'dup@teste.com', papel: 'CLIENTE' });

    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nome: 'Outro', email: 'dup@teste.com', senha: 'senha123' });

    expect(res.status).toBe(409);
  });

  it('rejeita senha curta com 400', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nome: 'Fulano', email: 'curta@teste.com', senha: '123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('autentica com credenciais corretas', async () => {
    await criarUsuario({ email: 'login@teste.com', papel: 'CLIENTE', senha: 'senha123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@teste.com', senha: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejeita senha errada com 401', async () => {
    await criarUsuario({ email: 'login2@teste.com', papel: 'CLIENTE', senha: 'senha123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login2@teste.com', senha: 'errada' });

    expect(res.status).toBe(401);
  });

  it('rejeita conta desativada com 401, mesmo com senha correta', async () => {
    await criarUsuario({ email: 'inativo@teste.com', papel: 'CLIENTE', senha: 'senha123', ativo: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inativo@teste.com', senha: 'senha123' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('rejeita sem token com 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejeita token de usuário desativado após o login (corte imediato de acesso)', async () => {
    const usuario = await criarUsuario({ email: 'corte@teste.com', papel: 'CLIENTE', senha: 'senha123' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'corte@teste.com', senha: 'senha123' });

    const { prisma } = require('./helpers');
    await prisma.usuario.update({ where: { id: usuario.id }, data: { ativo: false } });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(401);
  });
});
