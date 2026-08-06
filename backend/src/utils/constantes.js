const PAPEIS = Object.freeze({
  CLIENTE: 'CLIENTE',
  ATENDENTE: 'ATENDENTE',
  ADMIN: 'ADMIN',
});

const STATUS_TICKET = Object.freeze({
  ABERTO: 'ABERTO',
  EM_ATENDIMENTO: 'EM_ATENDIMENTO',
  FECHADO: 'FECHADO',
});

const PRIORIDADES = Object.freeze({
  BAIXA: 'BAIXA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA',
});

// Transições válidas do Kanban — impede pular direto de ABERTO para
// FECHADO sem passar por atendimento, e reabrir um chamado fechado
// manda ele de volta para EM_ATENDIMENTO, nunca direto para ABERTO
// (o atendente responsável continua o mesmo).
const TRANSICOES_STATUS = Object.freeze({
  [STATUS_TICKET.ABERTO]: [STATUS_TICKET.EM_ATENDIMENTO],
  [STATUS_TICKET.EM_ATENDIMENTO]: [STATUS_TICKET.ABERTO, STATUS_TICKET.FECHADO],
  [STATUS_TICKET.FECHADO]: [STATUS_TICKET.EM_ATENDIMENTO],
});

module.exports = { PAPEIS, STATUS_TICKET, PRIORIDADES, TRANSICOES_STATUS };
