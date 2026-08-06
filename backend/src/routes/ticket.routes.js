const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { PAPEIS } = require('../utils/constantes');
const {
  criarTicketSchema,
  listarTicketsQuerySchema,
  atualizarStatusSchema,
  atribuirTicketSchema,
  criarComentarioSchema,
} = require('../schemas/ticket.schema');
const ticketController = require('../controllers/ticket.controller');

const router = Router();

router.use(requireAuth);

router.get('/', validate(listarTicketsQuerySchema, 'query'), asyncHandler(ticketController.listar));

// Só cliente abre chamado — atendente/admin não criam chamado em nome de
// ninguém neste fluxo (mantém "quem relata o problema" == "quem abriu").
router.post(
  '/',
  requireRole(PAPEIS.CLIENTE),
  validate(criarTicketSchema),
  asyncHandler(ticketController.criar),
);

router.get('/:id', asyncHandler(ticketController.buscarPorId));

router.patch(
  '/:id/status',
  requireRole(PAPEIS.ATENDENTE, PAPEIS.ADMIN),
  validate(atualizarStatusSchema),
  asyncHandler(ticketController.atualizarStatus),
);

router.patch(
  '/:id/atribuir',
  requireRole(PAPEIS.ADMIN),
  validate(atribuirTicketSchema),
  asyncHandler(ticketController.reatribuir),
);

router.delete('/:id', requireRole(PAPEIS.ADMIN), asyncHandler(ticketController.excluir));

router.post(
  '/:id/comentarios',
  validate(criarComentarioSchema),
  asyncHandler(ticketController.adicionarComentario),
);

module.exports = router;
