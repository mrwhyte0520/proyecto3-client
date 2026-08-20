import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getProject, updateProject, listMembers } from '../services/projects';
import { listTasks, createTask, updateTaskStatus } from '../services/tasks';
import TaskModal from '../components/TaskModal';

const STATUS = { Todo: 0, InProgress: 1, Done: 2 };
const COLUMNS = [
  { key: STATUS.Todo, title: 'Por hacer' },
  { key: STATUS.InProgress, title: 'En progreso' },
  { key: STATUS.Done, title: 'Hecho' },
];
const PRIORITY_LABEL = { 0: 'Baja', 1: 'Media', 2: 'Alta' };
const PRIORITY_CLASS = { 0: 'prio-low', 1: 'prio-med', 2: 'prio-high' };

export default function ProjectBoard() {
  const { projectId } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Nueva tarea
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(1);
  const [creating, setCreating] = useState(false);

  // Filtros (server-side)
  const [filters, setFilters] = useState({ prioridad: '', asignado: '' });

  // Edición del proyecto
  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });

  const [selectedTask, setSelectedTask] = useState(null);

  const canEdit = project?.role === 'Owner' || project?.role === 'Editor';

  const loadTasks = useCallback(async () => {
    const data = await listTasks(projectId, filters);
    setTasks(data.items);
  }, [projectId, filters]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [proj, mem, tasksData] = await Promise.all([
        getProject(projectId),
        listMembers(projectId),
        listTasks(projectId, filters),
      ]);
      setProject(proj);
      setMembers(mem);
      setTasks(tasksData.items);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar el proyecto.'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Recarga solo tareas cuando cambian los filtros (evita recargar todo).
  useEffect(() => {
    if (!project) return;
    loadTasks().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError('');
    try {
      const created = await createTask(projectId, { title: title.trim(), priority: Number(priority) });
      // Solo lo mostramos si pasa el filtro actual de prioridad.
      if (filters.prioridad === '' || Number(filters.prioridad) === created.priority) {
        setTasks((prev) => [...prev, created]);
      }
      setTitle('');
      setPriority(1);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear la tarea.'));
    } finally {
      setCreating(false);
    }
  }

  async function moveTask(task, newStatus) {
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    try {
      await updateTaskStatus(task.id, newStatus);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo mover la tarea.'));
      setTasks(previous);
    }
  }

  function startEditProject() {
    setProjectForm({ name: project.name, description: project.description ?? '' });
    setEditingProject(true);
  }

  async function handleSaveProject(e) {
    e.preventDefault();
    if (!projectForm.name.trim()) return;
    try {
      await updateProject(projectId, {
        name: projectForm.name.trim(),
        description: projectForm.description.trim() || null,
      });
      setProject((prev) => ({ ...prev, name: projectForm.name.trim(), description: projectForm.description.trim() || null }));
      setEditingProject(false);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo actualizar el proyecto.'));
    }
  }

  if (loading) return <div className="container"><p className="muted">Cargando…</p></div>;
  if (error && !project) return (
    <div className="container"><p className="error">{error}</p><Link to="/" className="muted">← Volver</Link></div>
  );

  return (
    <div className="container">
      <Link to="/" className="muted">← Volver a proyectos</Link>

      {editingProject ? (
        <form className="card create-form" onSubmit={handleSaveProject}>
          <h3>Editar proyecto</h3>
          <input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} maxLength={150} required />
          <input value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} maxLength={1000} placeholder="Descripción (opcional)" />
          <div className="modal-actions-right">
            <button type="button" className="btn btn-ghost" onClick={() => setEditingProject(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      ) : (
        <div className="board-header">
          <div>
            <h1>{project?.name} <span className="role-badge">{project?.role}</span></h1>
            {project?.description && <p className="muted">{project.description}</p>}
          </div>
          <div className="board-header-actions">
            <Link to={`/projects/${projectId}/members`} className="btn btn-ghost btn-sm">Miembros ({members.length})</Link>
            {canEdit && <button className="btn btn-ghost btn-sm" onClick={startEditProject}>Editar</button>}
          </div>
        </div>
      )}

      {canEdit && (
        <form className="card create-form row" onSubmit={handleCreate}>
          <input placeholder="Nueva tarea…" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value={0}>Prioridad: Baja</option>
            <option value={1}>Prioridad: Media</option>
            <option value={2}>Prioridad: Alta</option>
          </select>
          <button className="btn btn-primary" type="submit" disabled={creating}>{creating ? 'Agregando…' : 'Agregar'}</button>
        </form>
      )}

      <div className="filters">
        <span className="filter-label">Filtros:</span>
        <select value={filters.prioridad} onChange={(e) => setFilters((f) => ({ ...f, prioridad: e.target.value }))} className="filter-select">
          <option value="">Prioridad: todas</option>
          <option value={2}>Alta</option>
          <option value={1}>Media</option>
          <option value={0}>Baja</option>
        </select>
        <select value={filters.asignado} onChange={(e) => setFilters((f) => ({ ...f, asignado: e.target.value }))} className="filter-select">
          <option value="">Asignado: todos</option>
          {members.map((m) => <option key={m.userId} value={m.userId}>{m.displayName}</option>)}
        </select>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="board">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="column">
              <h3 className="column-title">{col.title} <span className="badge">{items.length}</span></h3>
              {items.length === 0 && <p className="muted small">Sin tareas</p>}
              {items.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-top">
                    <span className={`prio ${PRIORITY_CLASS[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
                    <button className="link-btn" onClick={() => setSelectedTask(task)}>Ver</button>
                  </div>
                  <button className="task-title-btn" onClick={() => setSelectedTask(task)}>{task.title}</button>
                  <div className="task-meta">
                    {task.assignedToName && <span className="chip">{task.assignedToName}</span>}
                    {task.commentCount > 0 && <span className="chip">💬 {task.commentCount}</span>}
                    {task.attachmentCount > 0 && <span className="chip">📎 {task.attachmentCount}</span>}
                  </div>
                  {task.dueDate && <p className="muted small">Vence: {new Date(task.dueDate).toLocaleDateString()}</p>}
                  {canEdit && (
                    <div className="task-actions">
                      {col.key !== STATUS.Todo && <button className="btn btn-ghost btn-sm" onClick={() => moveTask(task, col.key - 1)}>←</button>}
                      {col.key !== STATUS.Done && <button className="btn btn-ghost btn-sm" onClick={() => moveTask(task, col.key + 1)}>→</button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          members={members}
          canEdit={canEdit}
          currentUserId={user?.id}
          onClose={() => setSelectedTask(null)}
          onSaved={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
            setSelectedTask(null);
          }}
          onDeleted={(id) => {
            setTasks((prev) => prev.filter((t) => t.id !== id));
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
