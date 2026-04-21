import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const staffApi = {
  list: (role) => api.get('/staff', { params: role ? { role } : {} }).then(r => r.data),
};
