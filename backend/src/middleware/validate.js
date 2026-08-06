const AppError = require('../utils/AppError');

// Valida body/params/query com um schema Zod e substitui req[parte] pelo
// resultado já parseado (com defaults/coerções aplicados pelo schema).
const validate = (schema, parte = 'body') => (req, res, next) => {
  const resultado = schema.safeParse(req[parte]);

  if (!resultado.success) {
    const detalhes = resultado.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    return next(new AppError(`Dados inválidos — ${detalhes}`, 400));
  }

  req[parte] = resultado.data;
  next();
};

module.exports = validate;
