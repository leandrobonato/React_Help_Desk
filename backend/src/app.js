const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Limite de requisições focado em login/registro — evita força bruta de
// senha sem travar o uso normal da API (que não tem esse limite).
// Desativado em teste: a suíte faz login de vários usuários a cada
// `beforeEach`, o que estouraria o limite em minutos sem representar
// força bruta real.
if (process.env.NODE_ENV !== 'test') {
  const limiteAuth = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/auth/login', limiteAuth);
  app.use('/api/auth/registro', limiteAuth);
}

app.use('/api', routes);

app.use((req, res, next) => next(new AppError('Rota não encontrada', 404)));
app.use(errorHandler);

module.exports = app;
