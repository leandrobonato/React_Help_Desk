const AppError = require('../utils/AppError');
const { verificarToken } = require('../lib/jwt');
const prisma = require('../lib/prisma');
const asyncHandler = require('./asyncHandler');

// Autentica pelo Bearer token e carrega o usuário atual do banco (não só
// confia no payload do JWT) — assim uma conta desativada perde acesso
// imediatamente, mesmo com um token ainda válido.
const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [tipo, token] = authHeader.split(' ');

  if (tipo !== 'Bearer' || !token) {
    throw new AppError('Não autenticado — token ausente', 401);
  }

  const payload = verificarToken(token);

  const usuario = await prisma.usuario.findUnique({ where: { id: payload.sub } });
  if (!usuario || !usuario.ativo) {
    throw new AppError('Conta inexistente ou desativada', 401);
  }

  req.usuario = usuario;
  next();
});

// Autorização por papel — cliente do menor privilégio: qualquer papel fora
// da lista permitida é rejeitado com 403, nunca com um erro genérico.
const requireRole = (...papeisPermitidos) => (req, res, next) => {
  if (!req.usuario || !papeisPermitidos.includes(req.usuario.papel)) {
    return next(new AppError('Você não tem permissão para esta ação', 403));
  }
  next();
};

module.exports = { requireAuth, requireRole };
