import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (!isAuthenticated) {
    return (
      <header className="public-header">
        <Link to="/login" className="brand">Tareas</Link>
      </header>
    );
  }

  return (
    <aside className="sidebar">
      <Link to="/" className="brand">Tareas</Link>
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>Proyectos</NavLink>
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>Perfil</NavLink>
      </nav>
      <div className="sidebar-user">
        <span className="muted small">{user.displayName}</span>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Salir</button>
      </div>
    </aside>
  );
}
