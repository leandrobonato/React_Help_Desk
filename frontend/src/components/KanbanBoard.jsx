import { DragDropContext } from '@hello-pangea/dnd';
import KanbanColumn from './KanbanColumn';
import useTicketStore from '../store/ticketStore';

const COLUNAS = [
  { status: 'ABERTO', titulo: 'Aberto' },
  { status: 'EM_ATENDIMENTO', titulo: 'Em Atendimento' },
  { status: 'FECHADO', titulo: 'Fechado' },
];

function KanbanBoard({ tickets, usuario, onAbrirTicket, onErro }) {
  const moverStatus = useTicketStore((s) => s.moverStatus);

  async function handleDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    try {
      await moverStatus(draggableId, destination.droppableId);
    } catch (err) {
      onErro?.(err.response?.data?.erro || 'Não foi possível mover o chamado');
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban">
        {COLUNAS.map((coluna) => (
          <KanbanColumn
            key={coluna.status}
            status={coluna.status}
            titulo={coluna.titulo}
            tickets={tickets.filter((t) => t.status === coluna.status)}
            usuario={usuario}
            onAbrirTicket={onAbrirTicket}
          />
        ))}
      </div>
    </DragDropContext>
  );
}

export default KanbanBoard;
