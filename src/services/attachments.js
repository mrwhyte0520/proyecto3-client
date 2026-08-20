import api from '../api/client';

export const listAttachments = (taskId) =>
  api.get(`/tasks/${taskId}/attachments`).then((r) => r.data);

export const uploadAttachment = (taskId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const deleteAttachment = (id) => api.delete(`/attachments/${id}`);

// Descarga el adjunto como blob y dispara la descarga en el navegador.
export async function downloadAttachment(id, fileName) {
  const { data } = await api.get(`/attachments/${id}`, { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
