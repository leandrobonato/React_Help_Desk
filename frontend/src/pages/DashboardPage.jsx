import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import useTicketStore from '../store/ticketStore';
import KanbanBoard from '../components/KanbanBoard';
import PriorityFilter from '../components/PriorityFilter';
import TicketDetalheModal from '../components/TicketDetalheModal';

function DashboardPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const { tickets, carregando, erro, filtroPrioridade, setFiltroPrioridade, carregarTickets } =
    useTicketStore();
  const [ticketAbertoId, setTicketAbertoId] = useState(null);
  const [erroAcao, setErroAcao] = useState('');

  useEffect(() => {
    carregarTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroPrioridade]);

  return (
    <div className="pagina">
      <div className="pagina__cabecalho">
        <h1>Painel de chamados</h1>
        <PriorityFilter valor={filtroPrioridade} onChange={setFiltroPrioridade} />
      </div>

      {erroAcao && <div className="mensagem-erro" style={{ marginBottom: 16 }}>{erroAcao}</div>}
      {erro && <div className="mensagem-erro" style={{ marginBottom: 16 }}>{erro}</div>}

      {carregando ? (
        <div className="spinner-carregando">Carregando chamados…</div>
      ) : (
        <KanbanBoard
          tickets={tickets}
          usuario={usuario}
          onAbrirTicket={(ticket) => setTicketAbertoId(ticket.id)}
          onErro={setErroAcao}
        />
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

export default DashboardPage;
