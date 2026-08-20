import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">📋 Gestor de Tareas</Link>
      {isAuthenticated && (
        <nav className="nav-right">
          <Link to="/profile" className="muted">Hola, {user.displayName}</Link>
          <button className="btn btn-ghost" onClick={handleLogout}>Salir</button>
        </nav>
      )}
    </header>
  );
}
