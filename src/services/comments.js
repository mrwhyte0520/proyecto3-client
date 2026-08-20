import api from '../api/client';

export const listComments = (taskId) =>
  api.get(`/tasks/${taskId}/comments`).then((r) => r.data);
export const addComment = (taskId, content) =>
  api.post(`/tasks/${taskId}/comments`, { content }).then((r) => r.data);
export const deleteComment = (id) => api.delete(`/comments/${id}`);
