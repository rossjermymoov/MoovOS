import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const surchargesApi = {
  // Surcharge definitions
  list: (params) =>
    api.get('/surcharges', { params }).then(r => r.data),
  create: (data) =>
    api.post('/surcharges', data).then(r => r.data),
  update: (id, data) =>
    api.patch(`/surcharges/${id}`, data).then(r => r.data),
  delete: (id) =>
    api.delete(`/surcharges/${id}`).then(r => r.data),

  // Rules
  addRule: (surchargeId, data) =>
    api.post(`/surcharges/${surchargeId}/rules`, data).then(r => r.data),
  updateRule: (surchargeId, ruleId, data) =>
    api.patch(`/surcharges/${surchargeId}/rules/${ruleId}`, data).then(r => r.data),
  deleteRule: (surchargeId, ruleId) =>
    api.delete(`/surcharges/${surchargeId}/rules/${ruleId}`).then(r => r.data),

  // Customer overrides
  getCustomerOverrides: (customerId) =>
    api.get(`/surcharges/customer-overrides/${customerId}`).then(r => r.data),
  upsertCustomerOverride: (customerId, data) =>
    api.post(`/surcharges/customer-overrides/${customerId}`, data).then(r => r.data),
  deleteCustomerOverride: (customerId, overrideId) =>
    api.delete(`/surcharges/customer-overrides/${customerId}/${overrideId}`).then(r => r.data),
};
