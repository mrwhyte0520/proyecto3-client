import { useNavigate } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';

/**
 * Perfil del usuario autenticado.
 * Demuestra el uso del custom hook useFetch contra GET /auth/me.
 */
export default function Profile() {
  const { data: profile, loading, error } = useFetch('/auth/me');
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="container">
      <h1>Mi perfil</h1>

      {loading && <p className="muted">Cargando…</p>}
      {error && <p className="error">{error}</p>}

      {profile && (
        <div className="card profile-card">
          <div className="avatar" aria-hidden="true">
            {profile.displayName?.charAt(0).toUpperCase()}
          </div>
          <dl className="profile-fields">
            <dt>Nombre</dt>
            <dd>{profile.displayName}</dd>
            <dt>Correo</dt>
            <dd>{profile.email}</dd>
            <dt>ID de usuario</dt>
            <dd>#{profile.id}</dd>
          </dl>
          <button className="btn btn-danger" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      )}
    </div>
  );
}
