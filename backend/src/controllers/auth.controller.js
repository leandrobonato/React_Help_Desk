const authService = require('../services/auth.service');
const { paraDTO } = require('../services/auth.service');

async function registrar(req, res) {
  const resultado = await authService.registrar(req.body);
  res.status(201).json(resultado);
}

async function login(req, res) {
  const resultado = await authService.login(req.body);
  res.status(200).json(resultado);
}

async function me(req, res) {
  res.status(200).json({ usuario: paraDTO(req.usuario) });
}

module.exports = { registrar, login, me };
