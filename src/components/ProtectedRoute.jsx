import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Envuelve rutas que requieren sesión. Redirige al login si no hay usuario.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="center muted">Cargando…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
