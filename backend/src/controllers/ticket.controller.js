const ticketService = require('../services/ticket.service');

async function listar(req, res) {
  const tickets = await ticketService.listar(req.usuario, req.query);
  res.status(200).json({ tickets });
}

async function buscarPorId(req, res) {
  const ticket = await ticketService.buscarPorId(req.usuario, req.params.id);
  res.status(200).json({ ticket });
}

async function criar(req, res) {
  const ticket = await ticketService.criar(req.usuario, req.body);
  res.status(201).json({ ticket });
}

async function atualizarStatus(req, res) {
  const ticket = await ticketService.atualizarStatus(req.usuario, req.params.id, req.body.status);
  res.status(200).json({ ticket });
}

async function reatribuir(req, res) {
  const ticket = await ticketService.reatribuir(req.usuario, req.params.id, req.body.atendenteId);
  res.status(200).json({ ticket });
}

async function excluir(req, res) {
  await ticketService.excluir(req.usuario, req.params.id);
  res.status(204).send();
}

async function adicionarComentario(req, res) {
  const comentario = await ticketService.adicionarComentario(req.usuario, req.params.id, req.body.mensagem);
  res.status(201).json({ comentario });
}

module.exports = { listar, buscarPorId, criar, atualizarStatus, reatribuir, excluir, adicionarComentario };
