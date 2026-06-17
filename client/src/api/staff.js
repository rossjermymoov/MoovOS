import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const staffApi = {
  // Accepts a role string (back-compat), a params object like { team_id }, or nothing.
  list: (arg) => api.get('/staff', { params: typeof arg === 'string' ? { role: arg } : (arg || {}) }).then(r => r.data),
};
