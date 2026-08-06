const OPCOES = [
  { valor: null, rotulo: 'Todas' },
  { valor: 'ALTA', rotulo: 'Alta' },
  { valor: 'MEDIA', rotulo: 'Média' },
  { valor: 'BAIXA', rotulo: 'Baixa' },
];

function PriorityFilter({ valor, onChange }) {
  return (
    <div className="filtro-prioridade">
      {OPCOES.map((opcao) => (
        <button
          key={opcao.rotulo}
          type="button"
          className={valor === opcao.valor ? 'ativo' : ''}
          onClick={() => onChange(opcao.valor)}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}

export default PriorityFilter;
