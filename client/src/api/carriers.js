import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const carriersApi = {
  // Couriers
  getCouriers: ()                   => api.get('/carriers/couriers').then(r => r.data),
  createCourier: (data)             => api.post('/carriers/couriers', data).then(r => r.data),
  updateCourier: (id, data)         => api.patch(`/carriers/couriers/${id}`, data).then(r => r.data),
  deleteCourier: (id)               => api.delete(`/carriers/couriers/${id}`).then(r => r.data),

  // Services
  getServices: (courierId)          => api.get('/carriers/services', { params: { courier_id: courierId } }).then(r => r.data),
  getService: (id)                  => api.get(`/carriers/services/${id}`).then(r => r.data),
  createService: (data)             => api.post('/carriers/services', data).then(r => r.data),
  updateService: (id, data)         => api.patch(`/carriers/services/${id}`, data).then(r => r.data),
  deleteService: (id)               => api.delete(`/carriers/services/${id}`).then(r => r.data),

  // Zones
  createZone: (data)                => api.post('/carriers/zones', data).then(r => r.data),
  updateZone: (id, data)            => api.patch(`/carriers/zones/${id}`, data).then(r => r.data),
  deleteZone: (id)                  => api.delete(`/carriers/zones/${id}`).then(r => r.data),
  addCountry: (zoneId, data)        => api.post(`/carriers/zones/${zoneId}/countries`, data).then(r => r.data),
  removeCountry: (id)               => api.delete(`/carriers/zones/countries/${id}`).then(r => r.data),
  addPostcodeRule: (zoneId, data)   => api.post(`/carriers/zones/${zoneId}/postcode-rules`, data).then(r => r.data),
  removePostcodeRule: (id)          => api.delete(`/carriers/zones/postcode-rules/${id}`).then(r => r.data),

  // Weight bands
  createWeightBand: (data)          => api.post('/carriers/weight-bands', data).then(r => r.data),
  updateWeightBand: (id, data)      => api.patch(`/carriers/weight-bands/${id}`, data).then(r => r.data),
  deleteWeightBand: (id)            => api.delete(`/carriers/weight-bands/${id}`).then(r => r.data),

  // Dim weight rules
  createDimRule: (data)             => api.post('/carriers/dim-weight-rules', data).then(r => r.data),
  updateDimRule: (id, data)         => api.patch(`/carriers/dim-weight-rules/${id}`, data).then(r => r.data),
  deleteDimRule: (id)               => api.delete(`/carriers/dim-weight-rules/${id}`).then(r => r.data),

  // Congestion surcharges
  createCongestion: (data)          => api.post('/carriers/congestion-surcharges', data).then(r => r.data),
  updateCongestion: (id, data)      => api.patch(`/carriers/congestion-surcharges/${id}`, data).then(r => r.data),
  deleteCongestion: (id)            => api.delete(`/carriers/congestion-surcharges/${id}`).then(r => r.data),

  // Rules engine
  getRules: ()                      => api.get('/carriers/rules').then(r => r.data),
  createRule: (data)                => api.post('/carriers/rules', data).then(r => r.data),
  updateRule: (id, data)            => api.patch(`/carriers/rules/${id}`, data).then(r => r.data),
  deleteRule: (id)                  => api.delete(`/carriers/rules/${id}`).then(r => r.data),
  addCondition: (ruleId, data)      => api.post(`/carriers/rules/${ruleId}/conditions`, data).then(r => r.data),
  removeCondition: (id)             => api.delete(`/carriers/rules/conditions/${id}`).then(r => r.data),
};
