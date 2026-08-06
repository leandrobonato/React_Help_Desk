import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTicketStore from '../store/ticketStore';

function NovoChamadoPage() {
  const criarTicket = useTicketStore((s) => s.criarTicket);
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('MEDIA');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await criarTicket({ titulo, descricao, prioridade });
      navigate('/meus-chamados');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Falha ao abrir o chamado');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pagina" style={{ maxWidth: 560 }}>
      <div className="pagina__cabecalho">
        <h1>Abrir novo chamado</h1>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        {erro && <div className="mensagem-erro">{erro}</div>}

        <div className="campo">
          <label htmlFor="titulo">Título</label>
          <input id="titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>

        <div className="campo">
          <label htmlFor="descricao">Descreva o problema</label>
          <textarea
            id="descricao"
            required
            minLength={10}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="prioridade">Prioridade</label>
          <select id="prioridade" value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
          </select>
        </div>

        <button type="submit" className="botao botao--primario" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Abrir chamado'}
        </button>
      </form>
    </div>
  );
}

export default NovoChamadoPage;
