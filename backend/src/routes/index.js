const { Router } = require('express');
const authRoutes = require('./auth.routes');
const usuarioRoutes = require('./usuario.routes');
const ticketRoutes = require('./ticket.routes');

const router = Router();

router.get('/saude', (req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/tickets', ticketRoutes);

module.exports = router;
