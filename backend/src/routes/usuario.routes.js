const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { PAPEIS } = require('../utils/constantes');
const {
  criarUsuarioSchema,
  atualizarPapelSchema,
  atualizarStatusUsuarioSchema,
} = require('../schemas/usuario.schema');
const usuarioController = require('../controllers/usuario.controller');

const router = Router();

// Toda a gestão de usuários (criar atendente/admin, promover, desativar)
// é restrita a ADMIN — é o único jeito de um atendente/admin passar a
// existir fora do auto-cadastro público como CLIENTE.
router.use(requireAuth, requireRole(PAPEIS.ADMIN));

router.get('/', asyncHandler(usuarioController.listar));
router.post('/', validate(criarUsuarioSchema), asyncHandler(usuarioController.criar));
router.patch('/:id/papel', validate(atualizarPapelSchema), asyncHandler(usuarioController.atualizarPapel));
router.patch(
  '/:id/status',
  validate(atualizarStatusUsuarioSchema),
  asyncHandler(usuarioController.atualizarStatus),
);

module.exports = router;
