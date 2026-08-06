import { useEffect, useState } from 'react';
import api from '../api/client';

const PAPEIS = ['CLIENTE', 'ATENDENTE', 'ADMIN'];

function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [novo, setNovo] = useState({ nome: '', email: '', senha: '', papel: 'ATENDENTE' });
  const [criando, setCriando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data.usuarios);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Falha ao carregar usuários');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criarUsuario(e) {
    e.preventDefault();
    setErro('');
    setCriando(true);
    try {
      await api.post('/usuarios', novo);
      setNovo({ nome: '', email: '', senha: '', papel: 'ATENDENTE' });
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Falha ao criar usuário');
    } finally {
      setCriando(false);
    }
  }

  async function mudarPapel(id, papel) {
    try {
      await api.patch(`/usuarios/${id}/papel`, { papel });
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Falha ao alterar papel');
    }
  }

  async function alternarAtivo(usuario) {
    try {
      await api.patch(`/usuarios/${usuario.id}/status`, { ativo: !usuario.ativo });
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Falha ao alterar status');
    }
  }

  return (
    <div className="pagina">
      <div className="pagina__cabecalho">
        <h1>Usuários</h1>
      </div>

      {erro && <div className="mensagem-erro" style={{ marginBottom: 16 }}>{erro}</div>}

      <form
        className="form"
        onSubmit={criarUsuario}
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr auto',
          gap: 12,
          alignItems: 'end',
          marginBottom: 24,
          background: 'var(--cor-superficie)',
          border: '1px solid var(--cor-borda)',
          borderRadius: 'var(--raio-lg)',
          padding: 16,
        }}
      >
        <div className="campo">
          <label>Nome</label>
          <input required value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
        </div>
        <div className="campo">
          <label>E-mail</label>
          <input
            type="email"
            required
            value={novo.email}
            onChange={(e) => setNovo({ ...novo, email: e.target.value })}
          />
        </div>
        <div className="campo">
          <label>Senha</label>
          <input
            type="password"
            required
            minLength={6}
            value={novo.senha}
            onChange={(e) => setNovo({ ...novo, senha: e.target.value })}
          />
        </div>
        <div className="campo">
          <label>Papel</label>
          <select value={novo.papel} onChange={(e) => setNovo({ ...novo, papel: e.target.value })}>
            {PAPEIS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="botao botao--primario" disabled={criando}>
          Criar
        </button>
      </form>

      {carregando ? (
        <div className="spinner-carregando">Carregando usuários…</div>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nome}</td>
                <td>{u.email}</td>
                <td>
                  <select value={u.papel} onChange={(e) => mudarPapel(u.id, e.target.value)}>
                    {PAPEIS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{u.ativo ? 'Ativo' : 'Desativado'}</td>
                <td>
                  <button
                    type="button"
                    className={`botao botao--pequeno ${u.ativo ? 'botao--perigo' : 'botao--primario'}`}
                    onClick={() => alternarAtivo(u)}
                  >
                    {u.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UsuariosPage;
