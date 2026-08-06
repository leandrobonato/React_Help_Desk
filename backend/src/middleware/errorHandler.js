const AppError = require('../utils/AppError');

// Erros conhecidos do Prisma traduzidos para HTTP, no mesmo espírito do
// projeto NodeJS_API_RestFul_Gerenciamento_Biblioteca (P2002/P2025/P2003).
function traduzirErroPrisma(err) {
  if (err.code === 'P2002') {
    const campo = err.meta?.target?.join?.(', ') || 'campo único';
    return new AppError(`Já existe um registro com o mesmo ${campo}`, 409);
  }
  if (err.code === 'P2025') {
    return new AppError('Registro não encontrado', 404);
  }
  if (err.code === 'P2003') {
    return new AppError('Referência inválida — registro relacionado não existe', 409);
  }
  return null;
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let erro = err;

  if (err.name?.startsWith('Prisma')) {
    erro = traduzirErroPrisma(err) || new AppError('Erro ao acessar o banco de dados', 500);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    erro = new AppError('Sessão inválida ou expirada — faça login novamente', 401);
  } else if (!(erro instanceof AppError)) {
    // eslint-disable-next-line no-console
    console.error(err);
    erro = new AppError('Erro interno do servidor', 500);
  }

  res.status(erro.statusCode).json({ erro: erro.message });
}

module.exports = errorHandler;
