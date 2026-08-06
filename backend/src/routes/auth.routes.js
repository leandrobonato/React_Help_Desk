const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { registroSchema, loginSchema } = require('../schemas/auth.schema');
const authController = require('../controllers/auth.controller');

const router = Router();

router.post('/registro', validate(registroSchema), asyncHandler(authController.registrar));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.get('/me', requireAuth, asyncHandler(authController.me));

module.exports = router;
