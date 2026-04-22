import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

const cspApi = {
  list: (customerId) =>
    api.get(`/customer-service-pricing/${customerId}`).then(r => r.data),

  upsert: (customerId, data) =>
    api.post(`/customer-service-pricing/${customerId}`, data).then(r => r.data),

  update: (customerId, id, data) =>
    api.patch(`/customer-service-pricing/${customerId}/${id}`, data).then(r => r.data),

  remove: (customerId, id) =>
    api.delete(`/customer-service-pricing/${customerId}/${id}`).then(r => r.data),

  availableRateCards: () =>
    api.get('/customer-service-pricing/available-rate-cards/list').then(r => r.data),
};

export default cspApi;
