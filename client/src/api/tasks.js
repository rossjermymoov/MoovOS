import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Tasks module API. Mirrors the pattern of the other api/*.js modules.
export const tasksApi = {
  list:            (params)      => api.get('/tasks', { params }).then(r => r.data),
  get:             (id)          => api.get(`/tasks/${id}`).then(r => r.data),
  create:          (body)        => api.post('/tasks', body).then(r => r.data),
  update:          (id, body)    => api.patch(`/tasks/${id}`, body).then(r => r.data),
  remove:          (id)          => api.delete(`/tasks/${id}`).then(r => r.data),
  addComment:      (id, body)    => api.post(`/tasks/${id}/comments`, body).then(r => r.data),
  addLink:         (id, body)    => api.post(`/tasks/${id}/links`, body).then(r => r.data),
  removeLink:      (id, linkId)  => api.delete(`/tasks/${id}/links/${linkId}`).then(r => r.data),
  addAttachment:   (id, body)    => api.post(`/tasks/${id}/attachments`, body).then(r => r.data),
  removeAttachment:(id, attId)   => api.delete(`/tasks/${id}/attachments/${attId}`).then(r => r.data),
};
