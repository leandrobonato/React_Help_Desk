const { z } = require('zod');
const { PAPEIS } = require('../utils/constantes');

// Só admin usa este schema (rota protegida) — aqui sim o papel pode ser
// escolhido livremente, inclusive ATENDENTE/ADMIN.
const criarUsuarioSchema = z.object({
  nome: z.string().trim().min(2, 'nome deve ter pelo menos 2 caracteres'),
  email: z.string().trim().toLowerCase().email('e-mail inválido'),
  senha: z.string().min(6, 'senha deve ter pelo menos 6 caracteres'),
  papel: z.nativeEnum(PAPEIS).default(PAPEIS.CLIENTE),
});

const atualizarPapelSchema = z.object({
  papel: z.nativeEnum(PAPEIS),
});

const atualizarStatusUsuarioSchema = z.object({
  ativo: z.boolean(),
});

module.exports = { criarUsuarioSchema, atualizarPapelSchema, atualizarStatusUsuarioSchema };
