const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { assinarToken } = require('../lib/jwt');
const AppError = require('../utils/AppError');
const { PAPEIS } = require('../utils/constantes');

const SALT_ROUNDS = 10;

function paraDTO(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    ativo: usuario.ativo,
  };
}

async function registrar({ nome, email, senha }) {
  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

  const usuario = await prisma.usuario.create({
    data: { nome, email, senhaHash, papel: PAPEIS.CLIENTE },
  });

  const token = assinarToken({ sub: usuario.id, papel: usuario.papel });
  return { usuario: paraDTO(usuario), token };
}

async function login({ email, senha }) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    throw new AppError('E-mail ou senha inválidos', 401);
  }
  if (!usuario.ativo) {
    throw new AppError('Conta desativada — contate um administrador', 401);
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    throw new AppError('E-mail ou senha inválidos', 401);
  }

  const token = assinarToken({ sub: usuario.id, papel: usuario.papel });
  return { usuario: paraDTO(usuario), token };
}

module.exports = { registrar, login, paraDTO };
