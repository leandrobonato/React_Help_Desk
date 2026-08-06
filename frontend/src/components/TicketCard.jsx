import { Draggable } from '@hello-pangea/dnd';
import { BadgePrioridade } from './Badges';

function TicketCard({ ticket, indice, podeArrastar, onAbrir }) {
  return (
    <Draggable draggableId={ticket.id} index={indice} isDragDisabled={!podeArrastar}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`ticket-card ${snapshot.isDragging ? 'ticket-card--arrastando' : ''}`}
          onClick={() => onAbrir(ticket)}
        >
          <div className="ticket-card__topo">
            <p className="ticket-card__titulo">{ticket.titulo}</p>
            <BadgePrioridade prioridade={ticket.prioridade} />
          </div>
          <div className="ticket-card__meta">
            <span>{ticket.cliente?.nome}</span>
            <span>{ticket.atendente ? ticket.atendente.nome : 'Sem atendente'}</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default TicketCard;
