import api from '../api/client';

// Lista paginada con filtros opcionales: { estado, prioridad, asignado, page, pageSize }.
// Devuelve el objeto PagedResult { items, page, pageSize, totalCount, totalPages }.
export const listTasks = (projectId, filters = {}) => {
  const params = {};
  if (filters.estado !== '' && filters.estado != null) params.estado = filters.estado;
  if (filters.prioridad !== '' && filters.prioridad != null) params.prioridad = filters.prioridad;
  if (filters.asignado !== '' && filters.asignado != null) params.asignado = filters.asignado;
  params.page = filters.page ?? 1;
  params.pageSize = filters.pageSize ?? 100;
  return api.get(`/projects/${projectId}/tasks`, { params }).then((r) => r.data);
};

export const getTask = (id) => api.get(`/tasks/${id}`).then((r) => r.data);
export const createTask = (projectId, payload) =>
  api.post(`/projects/${projectId}/tasks`, payload).then((r) => r.data);
export const updateTask = (id, payload) => api.put(`/tasks/${id}`, payload);
export const updateTaskStatus = (id, status) => api.patch(`/tasks/${id}/status`, { status });
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
