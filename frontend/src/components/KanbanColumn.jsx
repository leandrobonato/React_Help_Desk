import { Droppable } from '@hello-pangea/dnd';
import TicketCard from './TicketCard';

function KanbanColumn({ status, titulo, tickets, usuario, onAbrirTicket }) {
  return (
    <div className="kanban__coluna">
      <div className="kanban__coluna-titulo">
        <span>{titulo}</span>
        <span className="kanban__contador">{tickets.length}</span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`kanban__lista ${snapshot.isDraggingOver ? 'kanban__coluna--sobre-drag' : ''}`}
          >
            {tickets.map((ticket, indice) => {
              // Atendente só arrasta chamados atribuídos a ele mesmo — admin
              // arrasta qualquer um (a API valida os dois casos de novo).
              const podeArrastar =
                usuario.papel === 'ADMIN' ||
                (usuario.papel === 'ATENDENTE' && ticket.atendenteId === usuario.id);
              return (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  indice={indice}
                  podeArrastar={podeArrastar}
                  onAbrir={onAbrirTicket}
                />
              );
            })}
            {provided.placeholder}
            {tickets.length === 0 && <div className="vazio">Nenhum chamado aqui</div>}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default KanbanColumn;
