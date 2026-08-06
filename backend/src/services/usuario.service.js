const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const { paraDTO } = require('./auth.service');

const SALT_ROUNDS = 10;

async function listar({ papel } = {}) {
  const usuarios = await prisma.usuario.findMany({
    where: papel ? { papel } : undefined,
    orderBy: { nome: 'asc' },
  });
  return usuarios.map(paraDTO);
}

async function criar({ nome, email, senha, papel }) {
  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
  const usuario = await prisma.usuario.create({ data: { nome, email, senhaHash, papel } });
  return paraDTO(usuario);
}

// Papel e status ativo nunca são alterados por um update genérico — só por
// estas duas operações dedicadas, para deixar claro no código (e em log de
// auditoria futuro) toda mudança de privilégio ou desativação de conta.
async function atualizarPapel(id, papel) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new AppError('Usuário não encontrado', 404);

  const atualizado = await prisma.usuario.update({ where: { id }, data: { papel } });
  return paraDTO(atualizado);
}

async function atualizarStatus(id, ativo) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new AppError('Usuário não encontrado', 404);

  const atualizado = await prisma.usuario.update({ where: { id }, data: { ativo } });
  return paraDTO(atualizado);
}

module.exports = { listar, criar, atualizarPapel, atualizarStatus };
