const ROTULOS_PRIORIDADE = { ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' };
const ROTULOS_STATUS = { ABERTO: 'Aberto', EM_ATENDIMENTO: 'Em atendimento', FECHADO: 'Fechado' };

export function BadgePrioridade({ prioridade }) {
  return (
    <span
      className="badge"
      style={{
        color: `var(--prioridade-${prioridade.toLowerCase()})`,
        background: `var(--prioridade-${prioridade.toLowerCase()}-bg)`,
      }}
    >
      {ROTULOS_PRIORIDADE[prioridade] || prioridade}
    </span>
  );
}

export function BadgeStatus({ status }) {
  const estilos = {
    ABERTO: { color: 'var(--cor-alerta)', background: 'var(--cor-alerta-bg)' },
    EM_ATENDIMENTO: { color: 'var(--cor-primaria)', background: 'var(--cor-borda)' },
    FECHADO: { color: 'var(--cor-sucesso)', background: 'var(--cor-sucesso-bg)' },
  };
  return (
    <span className="badge" style={estilos[status]}>
      {ROTULOS_STATUS[status] || status}
    </span>
  );
}

export { ROTULOS_PRIORIDADE, ROTULOS_STATUS };
