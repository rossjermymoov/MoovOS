import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1/onboarding' });

export const onboardingApi = {
  board:        ()             => api.get('/board').then(r => r.data),
  get:          (id)           => api.get(`/${id}`).then(r => r.data),
  create:       (data)         => api.post('/create-customer', data).then(r => r.data),
  setStatus:    (id, status)   => api.patch(`/${id}/status`, { status }).then(r => r.data),
};
