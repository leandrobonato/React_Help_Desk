const { z } = require('zod');

// Auto-cadastro é sempre como CLIENTE — atendentes e admins só são
// criados por um admin já autenticado (ver usuario.schema.js), impedindo
// escalada de privilégio via cadastro público.
const registroSchema = z.object({
  nome: z.string().trim().min(2, 'nome deve ter pelo menos 2 caracteres'),
  email: z.string().trim().toLowerCase().email('e-mail inválido'),
  senha: z.string().min(6, 'senha deve ter pelo menos 6 caracteres'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('e-mail inválido'),
  senha: z.string().min(1, 'senha é obrigatória'),
});

module.exports = { registroSchema, loginSchema };
