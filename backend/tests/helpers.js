const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

async function resetarBanco() {
  await prisma.comentario.deleteMany();
  await prisma.historicoTicket.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.usuario.deleteMany();
}

async function criarUsuario({ nome = 'Usuário Teste', email, papel, ativo = true, senha = 'senha123' }) {
  const senhaHash = await bcrypt.hash(senha, 4);
  return prisma.usuario.create({ data: { nome, email, senhaHash, papel, ativo } });
}

module.exports = { prisma, resetarBanco, criarUsuario };
