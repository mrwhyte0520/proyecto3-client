import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { listProjects, createProject, deleteProject } from '../services/projects';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setProjects(await listProjects());
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar los proyectos.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      const created = await createProject({ name: name.trim(), description: description.trim() || null });
      setProjects((prev) => [created, ...prev]);
      setName('');
      setDescription('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear el proyecto.'));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(project) {
    if (!confirm('¿Eliminar este proyecto?')) return;
    setError('');
    try {
      await deleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (err) {
      // 409: el proyecto tiene tareas -> ofrecer borrado en cascada.
      if (err.response?.status === 409) {
        if (confirm('El proyecto tiene tareas. ¿Eliminarlo junto con todas sus tareas?')) {
          try {
            await deleteProject(project.id, true);
            setProjects((prev) => prev.filter((p) => p.id !== project.id));
          } catch (err2) {
            setError(getErrorMessage(err2, 'No se pudo eliminar el proyecto.'));
          }
        }
        return;
      }
      setError(getErrorMessage(err, 'No se pudo eliminar el proyecto.'));
    }
  }

  return (
    <div className="container">
      <h1>Mis proyectos</h1>

      <form className="card create-form" onSubmit={handleCreate}>
        <h3>Nuevo proyecto</h3>
        <input placeholder="Nombre del proyecto" value={name} onChange={(e) => setName(e.target.value)} maxLength={150} required />
        <input placeholder="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
        <button className="btn btn-primary" type="submit" disabled={creating}>{creating ? 'Creando…' : 'Crear proyecto'}</button>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : projects.length === 0 ? (
        <p className="muted">Aún no tienes proyectos. ¡Crea el primero!</p>
      ) : (
        <div className="grid">
          {projects.map((p) => (
            <div key={p.id} className="card project-card">
              <div className="project-head">
                <h3>{p.name} <span className="role-badge">{p.role}</span></h3>
                {p.role === 'Owner' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>Eliminar</button>
                )}
              </div>
              {p.description && <p className="muted">{p.description}</p>}
              <div className="project-foot">
                <span className="badge">{p.taskCount} tarea(s)</span>
                <Link to={`/projects/${p.id}`} className="btn btn-secondary btn-sm">Abrir tablero →</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
