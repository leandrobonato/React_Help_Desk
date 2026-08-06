import { useEffect, useState } from 'react';
import api from '../api/client';
import { BadgePrioridade, BadgeStatus } from './Badges';

const TRANSICOES = {
  ABERTO: ['EM_ATENDIMENTO'],
  EM_ATENDIMENTO: ['ABERTO', 'FECHADO'],
  FECHADO: ['EM_ATENDIMENTO'],
};

const ROTULOS_STATUS = { ABERTO: 'Aberto', EM_ATENDIMENTO: 'Em Atendimento', FECHADO: 'Fechado' };

function TicketDetalheModal({ ticketId, usuario, onClose, onAtualizado }) {
  const [ticket, setTicket] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [novoComentario, setNovoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [atendentes, setAtendentes] = useState([]);

  async function carregarTicket() {
    setCarregando(true);
    try {
      const { data } = await api.get(`/tickets/${ticketId}`);
      setTicket(data.ticket);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Falha ao carregar o chamado');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTicket();
    if (usuario.papel === 'ADMIN') {
      api
        .get('/usuarios', { params: { papel: 'ATENDENTE' } })
        .then(({ data }) => setAtendentes(data.usuarios))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const podeMudarStatus =
    ticket &&
    (usuario.papel === 'ADMIN' || (usuario.papel === 'ATENDENTE' && ticket.atendenteId === usuario.id));

  async function mudarStatus(novoStatus) {
    setErro('');
    try {
      await api.patch(`/tickets/${ticket.id}/status`, { status: novoStatus });
      await carregarTicket();
      onAtualizado?.();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível alterar o status');
    }
  }

  async function reatribuir(atendenteId) {
    if (!atendenteId) return;
    setErro('');
    try {
      await api.patch(`/tickets/${ticket.id}/atribuir`, { atendenteId });
      await carregarTicket();
      onAtualizado?.();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível reatribuir o chamado');
    }
  }

  async function excluir() {
    if (!window.confirm('Excluir este chamado definitivamente?')) return;
    try {
      await api.delete(`/tickets/${ticket.id}`);
      onAtualizado?.();
      onClose();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível excluir o chamado');
    }
  }

  async function enviarComentario(e) {
    e.preventDefault();
    if (!novoComentario.trim()) return;
    setEnviando(true);
    try {
      await api.post(`/tickets/${ticket.id}/comentarios`, { mensagem: novoComentario.trim() });
      setNovoComentario('');
      await carregarTicket();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível enviar o comentário');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="modal-fundo" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {carregando && <div className="spinner-carregando">Carregando…</div>}

        {!carregando && ticket && (
          <>
            <div className="modal__cabecalho">
              <div>
                <h2>{ticket.titulo}</h2>
                <div className="modal__tags">
                  <BadgePrioridade prioridade={ticket.prioridade} />
                  <BadgeStatus status={ticket.status} />
                </div>
              </div>
              <button type="button" className="modal__fechar" onClick={onClose} aria-label="Fechar">
                ×
              </button>
            </div>

            <p className="modal__descricao">{ticket.descricao}</p>

            <div className="modal__info">
              <span>Cliente: {ticket.cliente?.nome}</span>
              <span>Atendente: {ticket.atendente?.nome || 'Não atribuído'}</span>
              <span>Aberto em: {new Date(ticket.createdAt).toLocaleString('pt-BR')}</span>
            </div>

            {erro && <div className="mensagem-erro" style={{ marginBottom: 16 }}>{erro}</div>}

            {podeMudarStatus && (
              <div className="modal__acoes">
                {(TRANSICOES[ticket.status] || []).map((proximo) => (
                  <button
                    key={proximo}
                    type="button"
                    className="botao botao--primario botao--pequeno"
                    onClick={() => mudarStatus(proximo)}
                  >
                    Mover para {ROTULOS_STATUS[proximo]}
                  </button>
                ))}
                {usuario.papel === 'ADMIN' && (
                  <>
                    <select
                      defaultValue=""
                      onChange={(e) => reatribuir(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 6 }}
                    >
                      <option value="" disabled>
                        Reatribuir para…
                      </option>
                      {atendentes.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="botao botao--perigo botao--pequeno" onClick={excluir}>
                      Excluir chamado
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="comentarios">
              <h3>Comentários</h3>
              {ticket.comentarios.length === 0 && <p className="vazio">Nenhum comentário ainda</p>}
              {ticket.comentarios.map((c) => (
                <div className="comentario" key={c.id}>
                  <div className="comentario__cabecalho">
                    <span>
                      {c.autor.nome} ({c.autor.papel})
                    </span>
                    <span>{new Date(c.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="comentario__mensagem">{c.mensagem}</div>
                </div>
              ))}

              <form className="form-comentario" onSubmit={enviarComentario}>
                <textarea
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Escreva uma mensagem…"
                />
                <button type="submit" className="botao botao--primario" disabled={enviando}>
                  Enviar
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TicketDetalheModal;
