import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function Navbar() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  if (!usuario) return null;

  function sair() {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div className="navbar__marca">Central de Ajuda</div>
      <nav className="navbar__links">
        {usuario.papel === 'CLIENTE' && (
          <>
            <NavLink to="/meus-chamados">Meus chamados</NavLink>
            <NavLink to="/novo-chamado">Abrir chamado</NavLink>
          </>
        )}
        {(usuario.papel === 'ATENDENTE' || usuario.papel === 'ADMIN') && (
          <NavLink to="/dashboard">Painel</NavLink>
        )}
        {usuario.papel === 'ADMIN' && <NavLink to="/usuarios">Usuários</NavLink>}
      </nav>
      <div className="navbar__usuario">
        <span>
          {usuario.nome} <small>({usuario.papel})</small>
        </span>
        <button type="button" className="botao botao--ghost" onClick={sair}>
          Sair
        </button>
      </div>
    </header>
  );
}

export default Navbar;
