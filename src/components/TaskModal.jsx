import { useEffect, useState } from 'react';
import { getErrorMessage } from '../api/client';
import { updateTask, deleteTask } from '../services/tasks';
import { listComments, addComment, deleteComment } from '../services/comments';
import { listAttachments, uploadAttachment, deleteAttachment, downloadAttachment } from '../services/attachments';

const STATUS_OPTIONS = [
  { value: 0, label: 'Por hacer' },
  { value: 1, label: 'En progreso' },
  { value: 2, label: 'Hecho' },
];
const PRIORITY_OPTIONS = [
  { value: 0, label: 'Baja' },
  { value: 1, label: 'Media' },
  { value: 2, label: 'Alta' },
];

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'];

function toDateInput(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Modal de detalle de tarea: edición (si canEdit), asignación, comentarios y adjuntos.
 */
export default function TaskModal({ task, members, canEdit, currentUserId, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    dueDate: toDateInput(task.dueDate),
    assignedToId: task.assignedToId ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Comentarios
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  // Adjuntos
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    listComments(task.id).then(setComments).catch(() => {});
    listAttachments(task.id).then(setAttachments).catch(() => {});
  }, [task.id]);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: Number(form.status),
        priority: Number(form.priority),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        assignedToId: form.assignedToId === '' ? null : Number(form.assignedToId),
      };
      await updateTask(task.id, payload);
      const assignee = members.find((m) => m.userId === payload.assignedToId);
      onSaved({ ...task, ...payload, assignedToName: assignee ? assignee.displayName : null });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar la tarea.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) return;
    setSaving(true);
    setError('');
    try {
      await deleteTask(task.id);
      onDeleted(task.id);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo eliminar la tarea.'));
      setSaving(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentBusy(true);
    try {
      const created = await addComment(task.id, newComment.trim());
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo agregar el comentario.'));
    } finally {
      setCommentBusy(false);
    }
  }

  async function handleDeleteComment(id) {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo eliminar el comentario.'));
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-subir el mismo archivo
    if (!file) return;
    setFileError('');
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Tipo no permitido. Solo imágenes (PNG, JPG, GIF, WEBP) o PDF.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError('El archivo supera los 5 MB.');
      return;
    }
    setUploading(true);
    try {
      const created = await uploadAttachment(task.id, file);
      setAttachments((prev) => [created, ...prev]);
    } catch (err) {
      setFileError(getErrorMessage(err, 'No se pudo subir el archivo.'));
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAttachment(id) {
    try {
      await deleteAttachment(id);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo eliminar el adjunto.'));
    }
  }

  async function handleDownload(a) {
    try {
      await downloadAttachment(a.id, a.fileName);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo descargar el archivo.'));
    }
  }

  const readOnly = !canEdit;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Detalle de la tarea</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          <label>Título
            <input value={form.title} onChange={update('title')} maxLength={200} required disabled={readOnly} />
          </label>

          <label>Descripción
            <textarea
              value={form.description}
              onChange={update('description')}
              maxLength={2000}
              rows={3}
              placeholder="Detalles de la tarea…"
              disabled={readOnly}
            />
          </label>

          <div className="modal-row">
            <label>Estado
              <select value={form.status} onChange={update('status')} disabled={readOnly}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label>Prioridad
              <select value={form.priority} onChange={update('priority')} disabled={readOnly}>
                {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>

          <div className="modal-row">
            <label>Vencimiento
              <input type="date" value={form.dueDate} onChange={update('dueDate')} disabled={readOnly} />
            </label>
            <label>Asignado a
              <select value={form.assignedToId} onChange={update('assignedToId')} disabled={readOnly}>
                <option value="">— Sin asignar —</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.displayName}</option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className="error">{error}</p>}

          {!readOnly && (
            <div className="modal-actions">
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                Eliminar
              </button>
              <div className="modal-actions-right">
                <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Adjuntos */}
        <section className="modal-section">
          <h3>Adjuntos <span className="badge">{attachments.length}</span></h3>
          <label className="btn btn-ghost btn-sm file-btn">
            {uploading ? 'Subiendo…' : '+ Subir archivo'}
            <input type="file" hidden onChange={handleFileChange} disabled={uploading}
              accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,image/*,application/pdf" />
          </label>
          {fileError && <p className="error small">{fileError}</p>}
          {attachments.length === 0 && <p className="muted small">Sin adjuntos.</p>}
          <ul className="list">
            {attachments.map((a) => (
              <li key={a.id} className="list-item">
                <button type="button" className="link-btn" onClick={() => handleDownload(a)}>{a.fileName}</button>
                <span className="muted small">{formatSize(a.sizeBytes)}</span>
                {(a.uploadedById === currentUserId || canEdit) && (
                  <button type="button" className="link-danger" onClick={() => handleDeleteAttachment(a.id)}>✕</button>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Comentarios */}
        <section className="modal-section">
          <h3>Comentarios <span className="badge">{comments.length}</span></h3>
          {comments.length === 0 && <p className="muted small">Sé el primero en comentar.</p>}
          <ul className="list">
            {comments.map((c) => (
              <li key={c.id} className="comment">
                <div className="comment-head">
                  <strong>{c.userName}</strong>
                  <span className="muted small">{new Date(c.createdAt).toLocaleString()}</span>
                  {c.userId === currentUserId && (
                    <button type="button" className="link-danger" onClick={() => handleDeleteComment(c.id)}>✕</button>
                  )}
                </div>
                <p className="comment-body">{c.content}</p>
              </li>
            ))}
          </ul>
          <form className="comment-form" onSubmit={handleAddComment}>
            <input
              placeholder="Escribe un comentario…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={2000}
            />
            <button className="btn btn-primary btn-sm" type="submit" disabled={commentBusy || !newComment.trim()}>
              Comentar
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
