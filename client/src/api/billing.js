import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const billingApi = {
  getStats:      (params)      => api.get('/billing/charges/stats', { params }).then(r => r.data),
  getCharges:    (params)      => api.get('/billing/charges', { params }).then(r => r.data),
  getAgedAlerts: (days = 14)   => api.get('/billing/charges/aged-alerts', { params: { days } }).then(r => r.data),
  updateCharge:  (id, data)    => api.patch(`/billing/charges/${id}`, data).then(r => r.data),
  deleteCharge:  (id)          => api.delete(`/billing/charges/${id}`).then(r => r.data),
  debugCharge:   (id)          => api.get(`/billing/charges/${id}/debug`).then(r => r.data),
  repriceCharge: (id)          => api.post(`/billing/charges/${id}/reprice`).then(r => r.data),
  getPayload:    (id)          => api.get(`/billing/charges/${id}/payload`).then(r => r.data),
  batchReprice:         ()     => api.post('/billing/batch-reprice').then(r => r.data),
  batchApplySurcharges: (customerId) => api.post(`/billing/batch-apply-surcharges${customerId ? `?customer_id=${customerId}` : ''}`).then(r => r.data),
  getShipmentCharges: (shipmentId) => api.get(`/billing/shipments/${shipmentId}/charges`).then(r => r.data),
  purgeTrackingEvents:  ()     => api.post('/billing/purge-tracking-events').then(r => r.data),
  relinkCustomers:      ()     => api.post('/billing/relink-customers').then(r => r.data),
};
