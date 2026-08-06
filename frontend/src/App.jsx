import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import useAuthStore from './store/authStore';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegistroPage from './pages/RegistroPage';
import DashboardPage from './pages/DashboardPage';
import MeusChamadosPage from './pages/MeusChamadosPage';
import NovoChamadoPage from './pages/NovoChamadoPage';
import UsuariosPage from './pages/UsuariosPage';

function PaginaInicial() {
  const usuario = useAuthStore((s) => s.usuario);
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.papel === 'CLIENTE') return <Navigate to="/meus-chamados" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  const carregarSessao = useAuthStore((s) => s.carregarSessao);
  const carregando = useAuthStore((s) => s.carregando);

  useEffect(() => {
    carregarSessao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (carregando) return null;

  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute papeisPermitidos={['ATENDENTE', 'ADMIN']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meus-chamados"
          element={
            <ProtectedRoute papeisPermitidos={['CLIENTE']}>
              <MeusChamadosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/novo-chamado"
          element={
            <ProtectedRoute papeisPermitidos={['CLIENTE']}>
              <NovoChamadoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute papeisPermitidos={['ADMIN']}>
              <UsuariosPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<PaginaInicial />} />
        <Route path="*" element={<PaginaInicial />} />
      </Routes>
    </div>
  );
}

export default App;
