const { z } = require('zod');
const { PRIORIDADES, STATUS_TICKET } = require('../utils/constantes');

const criarTicketSchema = z.object({
  titulo: z.string().trim().min(3, 'título deve ter pelo menos 3 caracteres').max(150),
  descricao: z.string().trim().min(10, 'descreva o problema com pelo menos 10 caracteres'),
  prioridade: z.nativeEnum(PRIORIDADES).default(PRIORIDADES.MEDIA),
});

const listarTicketsQuerySchema = z.object({
  status: z.nativeEnum(STATUS_TICKET).optional(),
  prioridade: z.nativeEnum(PRIORIDADES).optional(),
});

const atualizarStatusSchema = z.object({
  status: z.nativeEnum(STATUS_TICKET),
});

const atribuirTicketSchema = z.object({
  atendenteId: z.string().uuid('id de atendente inválido'),
});

const criarComentarioSchema = z.object({
  mensagem: z.string().trim().min(1, 'a mensagem não pode ser vazia').max(2000),
});

module.exports = {
  criarTicketSchema,
  listarTicketsQuerySchema,
  atualizarStatusSchema,
  atribuirTicketSchema,
  criarComentarioSchema,
};
