import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Board configuration (spaces + status columns). Shared across the whole team.
export const taskConfigApi = {
  get:    ()     => api.get('/task-config').then(r => r.data),
  update: (data) => api.put('/task-config', data).then(r => r.data),
};
