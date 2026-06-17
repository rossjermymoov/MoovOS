import axios from 'axios';

const api = axios.create({ baseURL: '/api/integration-software' });

export const integrationSoftwareApi = {
  list: ()     => api.get('/').then(r => r.data),
  add:  (name) => api.post('/', { name }).then(r => r.data),
};
