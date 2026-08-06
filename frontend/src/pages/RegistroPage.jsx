import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function RegistroPage() {
  const registrar = useAuthStore((s) => s.registrar);
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await registrar(nome, email, senha);
      navigate('/meus-chamados');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Falha ao criar conta');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tela-auth">
      <div className="card-auth">
        <h1>Criar conta</h1>
        <p className="subtitulo">Cadastro de cliente — para abrir chamados de suporte</p>

        <form className="form" onSubmit={handleSubmit}>
          {erro && <div className="mensagem-erro">{erro}</div>}
          <div className="campo">
            <label htmlFor="nome">Nome</label>
            <input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
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
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <button type="submit" className="botao botao--primario" disabled={enviando}>
            {enviando ? 'Criando…' : 'Criar conta'}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: '0.85rem' }}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

export default RegistroPage;
