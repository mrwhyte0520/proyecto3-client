import api from '../api/client';

// --- Proyectos ---
export const listProjects = () => api.get('/projects').then((r) => r.data);
export const getProject = (id) => api.get(`/projects/${id}`).then((r) => r.data);
export const createProject = (payload) => api.post('/projects', payload).then((r) => r.data);
export const updateProject = (id, payload) => api.put(`/projects/${id}`, payload);
export const deleteProject = (id, force = false) =>
  api.delete(`/projects/${id}`, { params: { force } });

// --- Miembros ---
export const listMembers = (projectId) =>
  api.get(`/projects/${projectId}/members`).then((r) => r.data);
export const addMember = (projectId, email, role) =>
  api.post(`/projects/${projectId}/members`, { email, role }).then((r) => r.data);
export const updateMemberRole = (projectId, userId, role) =>
  api.put(`/projects/${projectId}/members/${userId}`, { role });
export const removeMember = (projectId, userId) =>
  api.delete(`/projects/${projectId}/members/${userId}`);
