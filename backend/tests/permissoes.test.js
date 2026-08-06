const request = require('supertest');
const app = require('../src/app');
const { resetarBanco, criarUsuario } = require('./helpers');

async function login(email, senha = 'senha123') {
  const res = await request(app).post('/api/auth/login').send({ email, senha });
  return res.body.token;
}

beforeEach(async () => {
  await resetarBanco();
});

describe('Gestão de usuários — restrita a ADMIN', () => {
  it('cliente e atendente recebem 403 em qualquer rota de /api/usuarios', async () => {
    const cliente = await criarUsuario({ email: 'cli@teste.com', papel: 'CLIENTE' });
    const atendente = await criarUsuario({ email: 'ate@teste.com', papel: 'ATENDENTE' });
    const tokenCliente = await login(cliente.email);
    const tokenAtendente = await login(atendente.email);

    for (const token of [tokenCliente, tokenAtendente]) {
      const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    }
  });

  it('admin cria um atendente diretamente com papel ATENDENTE', async () => {
    const admin = await criarUsuario({ email: 'adm@teste.com', papel: 'ADMIN' });
    const tokenAdmin = await login(admin.email);

    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nome: 'Novo Atendente', email: 'novoat@teste.com', senha: 'senha123', papel: 'ATENDENTE' });

    expect(res.status).toBe(201);
    expect(res.body.usuario.papel).toBe('ATENDENTE');
  });

  it('admin promove um cliente a atendente via PATCH /papel', async () => {
    const admin = await criarUsuario({ email: 'adm2@teste.com', papel: 'ADMIN' });
    const cliente = await criarUsuario({ email: 'promover@teste.com', papel: 'CLIENTE' });
    const tokenAdmin = await login(admin.email);

    const res = await request(app)
      .patch(`/api/usuarios/${cliente.id}/papel`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ papel: 'ATENDENTE' });

    expect(res.status).toBe(200);
    expect(res.body.usuario.papel).toBe('ATENDENTE');
  });

  it('admin desativa um atendente, que passa a não conseguir mais logar', async () => {
    const admin = await criarUsuario({ email: 'adm3@teste.com', papel: 'ADMIN' });
    const atendente = await criarUsuario({ email: 'desativar@teste.com', papel: 'ATENDENTE' });
    const tokenAdmin = await login(admin.email);

    const patch = await request(app)
      .patch(`/api/usuarios/${atendente.id}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ ativo: false });
    expect(patch.status).toBe(200);
    expect(patch.body.usuario.ativo).toBe(false);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: atendente.email, senha: 'senha123' });
    expect(loginRes.status).toBe(401);
  });
});
