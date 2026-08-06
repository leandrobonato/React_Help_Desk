import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function destinoPorPapel(papel) {
  if (papel === 'CLIENTE') return '/meus-chamados';
  return '/dashboard';
}

function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const usuario = await login(email, senha);
      navigate(destinoPorPapel(usuario.papel));
    } catch (err) {
      setErro(err.response?.data?.erro || 'Falha ao entrar');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tela-auth">
      <div className="card-auth">
        <h1>Entrar</h1>
        <p className="subtitulo">Acesse sua conta na Central de Ajuda</p>

        <form className="form" onSubmit={handleSubmit}>
          {erro && <div className="mensagem-erro">{erro}</div>}
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <button type="submit" className="botao botao--primario" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: '0.85rem' }}>
          Não tem conta? <Link to="/registro">Cadastre-se como cliente</Link>
        </p>

        <div className="card-auth__contas-teste">
          <strong>Contas de teste (senha: senha123):</strong>
          <br />
          Admin: admin@helpdesk.local
          <br />
          Atendente: bruno@helpdesk.local
          <br />
          Cliente: diego@cliente.local
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
