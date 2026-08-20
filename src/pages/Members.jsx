import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { getProject, listMembers, addMember, updateMemberRole, removeMember } from '../services/projects';

const ROLES = ['Editor', 'Viewer'];

export default function Members() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Editor');
  const [inviting, setInviting] = useState(false);

  const canManage = project?.role === 'Owner';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [proj, mem] = await Promise.all([getProject(projectId), listMembers(projectId)]);
      setProject(proj);
      setMembers(mem);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar los miembros.'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  async function handleInvite(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    setError('');
    try {
      const created = await addMember(projectId, email.trim(), role);
      setMembers((prev) => [...prev, created]);
      setEmail('');
      setRole('Editor');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo invitar al miembro.'));
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    setError('');
    try {
      await updateMemberRole(projectId, userId, newRole);
      setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m)));
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cambiar el rol.'));
    }
  }

  async function handleRemove(userId) {
    if (!confirm('¿Remover a este miembro del proyecto?')) return;
    setError('');
    try {
      await removeMember(projectId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo remover al miembro.'));
    }
  }

  if (loading) return <div className="container"><p className="muted">Cargando…</p></div>;

  return (
    <div className="container">
      <Link to={`/projects/${projectId}`} className="muted">← Volver al tablero</Link>
      <h1>Miembros de {project?.name}</h1>

      {canManage && (
        <form className="card create-form row" onSubmit={handleInvite}>
          <input type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="btn btn-primary" type="submit" disabled={inviting}>{inviting ? 'Invitando…' : 'Invitar'}</button>
        </form>
      )}

      {error && <p className="error">{error}</p>}

      <div className="grid">
        {members.map((m) => (
          <div key={m.userId} className="card member-card">
            <div className="avatar avatar-sm" aria-hidden="true">{m.displayName.charAt(0).toUpperCase()}</div>
            <div className="member-info">
              <strong>{m.displayName}</strong>
              <span className="muted small">{m.email}</span>
            </div>
            {m.isOwner ? (
              <span className="role-badge">Owner</span>
            ) : canManage ? (
              <div className="member-actions">
                <select value={m.role} onChange={(e) => handleRoleChange(m.userId, e.target.value)} className="filter-select">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button className="btn btn-danger btn-sm" onClick={() => handleRemove(m.userId)}>Remover</button>
              </div>
            ) : (
              <span className="role-badge">{m.role}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
