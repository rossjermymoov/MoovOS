import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const billingApi = {
  getStats: (params) => api.get('/billing/charges/stats', { params }).then(r => r.data),
  getCharges: (params) => api.get('/billing/charges', { params }).then(r => r.data),
  updateCharge: (id, data) => api.patch(`/billing/charges/${id}`, data).then(r => r.data),
  deleteCharge: (id) => api.delete(`/billing/charges/${id}`).then(r => r.data),
};
