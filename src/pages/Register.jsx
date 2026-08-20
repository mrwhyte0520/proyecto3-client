import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', displayName: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.email, form.displayName, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message ?? 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split">
      <div className="auth-side">
        <span className="auth-side-mark">Proyectos y Tareas</span>
        <h1>Crea tu cuenta</h1>
        <p>Regístrate para administrar proyectos colaborativos, tableros y tareas de tu equipo.</p>
      </div>
      <div className="auth-form-panel">
        <div className="auth-card">
          <h2>Crear cuenta</h2>
          <form onSubmit={handleSubmit}>
            <label>Nombre
              <input type="text" value={form.displayName} onChange={update('displayName')} minLength={2} required />
            </label>
            <label>Correo
              <input type="email" value={form.email} onChange={update('email')} required />
            </label>
            <label>Contraseña
              <input type="password" value={form.password} onChange={update('password')} minLength={6} required />
            </label>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creando…' : 'Registrarme'}
            </button>
          </form>
          <p className="muted">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </div>
      </div>
    </div>
  );
}
