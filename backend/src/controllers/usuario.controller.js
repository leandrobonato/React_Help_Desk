const usuarioService = require('../services/usuario.service');

async function listar(req, res) {
  const usuarios = await usuarioService.listar(req.query);
  res.status(200).json({ usuarios });
}

async function criar(req, res) {
  const usuario = await usuarioService.criar(req.body);
  res.status(201).json({ usuario });
}

async function atualizarPapel(req, res) {
  const usuario = await usuarioService.atualizarPapel(req.params.id, req.body.papel);
  res.status(200).json({ usuario });
}

async function atualizarStatus(req, res) {
  const usuario = await usuarioService.atualizarStatus(req.params.id, req.body.ativo);
  res.status(200).json({ usuario });
}

module.exports = { listar, criar, atualizarPapel, atualizarStatus };
