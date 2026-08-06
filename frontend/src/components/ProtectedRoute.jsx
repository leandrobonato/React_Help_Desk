import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// papeisPermitidos vazio/omitido = qualquer usuário autenticado pode entrar.
function ProtectedRoute({ children, papeisPermitidos }) {
  const usuario = useAuthStore((s) => s.usuario);
  const carregando = useAuthStore((s) => s.carregando);

  if (carregando) return null;

  if (!usuario) return <Navigate to="/login" replace />;

  if (papeisPermitidos && !papeisPermitidos.includes(usuario.papel)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
