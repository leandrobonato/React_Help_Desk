import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useTicketStore from '../store/ticketStore';
import PriorityFilter from '../components/PriorityFilter';
import TicketDetalheModal from '../components/TicketDetalheModal';
import { BadgePrioridade, BadgeStatus } from '../components/Badges';

function MeusChamadosPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const { tickets, carregando, erro, filtroPrioridade, setFiltroPrioridade, carregarTickets } =
    useTicketStore();
  const [ticketAbertoId, setTicketAbertoId] = useState(null);

  useEffect(() => {
    carregarTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroPrioridade]);

  return (
    <div className="pagina">
      <div className="pagina__cabecalho">
        <h1>Meus chamados</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <PriorityFilter valor={filtroPrioridade} onChange={setFiltroPrioridade} />
          <Link to="/novo-chamado" className="botao botao--primario">
            + Abrir chamado
          </Link>
        </div>
      </div>

      {erro && <div className="mensagem-erro" style={{ marginBottom: 16 }}>{erro}</div>}

      {carregando ? (
        <div className="spinner-carregando">Carregando chamados…</div>
      ) : tickets.length === 0 ? (
        <p className="vazio">Você ainda não abriu nenhum chamado.</p>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th>Título</th>
              <th>Prioridade</th>
              <th>Status</th>
              <th>Atendente</th>
              <th>Aberto em</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="clicavel" onClick={() => setTicketAbertoId(ticket.id)}>
                <td>{ticket.titulo}</td>
                <td>
                  <BadgePrioridade prioridade={ticket.prioridade} />
                </td>
                <td>
                  <BadgeStatus status={ticket.status} />
                </td>
                <td>{ticket.atendente?.nome || '—'}</td>
                <td>{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {ticketAbertoId && (
        <TicketDetalheModal
          ticketId={ticketAbertoId}
          usuario={usuario}
          onClose={() => setTicketAbertoId(null)}
          onAtualizado={carregarTickets}
        />
      )}
    </div>
  );
}

export default MeusChamadosPage;
