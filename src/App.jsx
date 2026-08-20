import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import ProjectBoard from './pages/ProjectBoard';
import Members from './pages/Members';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Evita mostrar login/register si ya hay sesión.
function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="center muted">Cargando…</div>;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

export default function App() {
  const { isAuthenticated } = useAuth();
  return (
    <div className={`app-shell${isAuthenticated ? '' : ' app-shell-public'}`}>
      <Navbar />
      <main className={isAuthenticated ? 'content' : 'main-auth'}>
        <Routes>
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectBoard /></ProtectedRoute>} />
          <Route path="/projects/:projectId/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
