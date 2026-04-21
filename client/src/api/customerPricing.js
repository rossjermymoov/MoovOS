import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const customerPricingApi = {
  // Sell rate cards
  getPricing: (customerId)      => api.get('/customer-pricing', { params: { customer_id: customerId } }).then(r => r.data),
  createPricing: (data)         => api.post('/customer-pricing', data).then(r => r.data),
  updatePricing: (id, data)     => api.patch(`/customer-pricing/${id}`, data).then(r => r.data),
  deletePricing: (id)           => api.delete(`/customer-pricing/${id}`).then(r => r.data),

  // Volume tiers
  getVolumeTiers: (customerId)  => api.get('/customer-pricing/volume-tiers', { params: { customer_id: customerId } }).then(r => r.data),
  createVolumeTier: (data)      => api.post('/customer-pricing/volume-tiers', data).then(r => r.data),
  updateVolumeTier: (id, data)  => api.patch(`/customer-pricing/volume-tiers/${id}`, data).then(r => r.data),
  deleteVolumeTier: (id)        => api.delete(`/customer-pricing/volume-tiers/${id}`).then(r => r.data),
};
