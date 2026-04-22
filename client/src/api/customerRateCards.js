import axios from 'axios';
const api = axios.create({ baseURL: '/api' });

export const customerRateCardsApi = {
  forCustomer:      (customerId) => api.get(`/customer-rate-cards/for-customer/${customerId}`).then(r => r.data),
  list:             (courier_id) => api.get('/customer-rate-cards', { params: { courier_id } }).then(r => r.data),
  getEntries:       (id)         => api.get(`/customer-rate-cards/${id}/entries`).then(r => r.data),
  create:           (data)       => api.post('/customer-rate-cards', data).then(r => r.data),
  clone:            (id, data)   => api.post(`/customer-rate-cards/${id}/clone`, data).then(r => r.data),
  update:           (id, data)   => api.patch(`/customer-rate-cards/${id}`, data).then(r => r.data),
  delete:           (id)         => api.delete(`/customer-rate-cards/${id}`).then(r => r.data),
  addEntry:         (id, data)   => api.post(`/customer-rate-cards/${id}/entries`, data).then(r => r.data),
  updateEntry:      (entryId, data) => api.patch(`/customer-rate-cards/entries/${entryId}`, data).then(r => r.data),
  deleteEntry:      (entryId)    => api.delete(`/customer-rate-cards/entries/${entryId}`).then(r => r.data),
  getAssignment:    (customerId, courierId) =>
    api.get(`/customer-rate-cards/assignment/${customerId}/${courierId}`).then(r => r.data),
  setAssignment:    (customerId, courierId, rate_card_id) =>
    api.post(`/customer-rate-cards/assignment/${customerId}/${courierId}`, { rate_card_id }).then(r => r.data),
  clearAssignment:  (customerId, courierId) =>
    api.delete(`/customer-rate-cards/assignment/${customerId}/${courierId}`).then(r => r.data),
};
