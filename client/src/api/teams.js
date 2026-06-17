import axios from 'axios';

const api = axios.create({ baseURL: '/api/teams' });

export const teamsApi = {
  list:   ()         => api.get('/').then(r => r.data),
  update: (id, data) => api.patch(`/${id}`, data).then(r => r.data),
};
