import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const customersApi = {
  list: (params) => api.get('/customers', { params }).then(r => r.data),
  get: (id) => api.get(`/customers/${id}`).then(r => r.data),
  create: (data) => api.post('/customers', data).then(r => r.data),
  update: (id, data) => api.patch(`/customers/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/customers/${id}`).then(r => r.data),

  applyOnStop: (id, { reason, staff_id }) =>
    api.post(`/customers/${id}/on-stop`, { reason, staff_id }).then(r => r.data),
  removeOnStop: (id, { note, staff_id }) =>
    api.delete(`/customers/${id}/on-stop`, { data: { note, staff_id } }).then(r => r.data),
  getOnStopLog: (id) =>
    api.get(`/customers/${id}/on-stop/log`).then(r => r.data),

  getContacts: (id) => api.get(`/customers/${id}/contacts`).then(r => r.data),
  addContact: (id, data) => api.post(`/customers/${id}/contacts`, data).then(r => r.data),

  getCommunications: (id, params) =>
    api.get(`/customers/${id}/communications`, { params }).then(r => r.data),

  getVolume: (id) => api.get(`/customers/${id}/volume`).then(r => r.data),

  dismissVolumeAlert: (customerId, alertId, { note, staff_id }) =>
    api.post(`/customers/${customerId}/volume-alerts/${alertId}/dismiss`, { note, staff_id })
       .then(r => r.data),
};
