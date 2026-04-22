import axios from 'axios';
const api = axios.create({ baseURL: '/api' });

export const carrierRateCardsApi = {
  list:          (courier_id) => api.get('/carrier-rate-cards', { params: { courier_id } }).then(r => r.data),
  getBands:      (id)         => api.get(`/carrier-rate-cards/${id}/bands`).then(r => r.data),
  create:        (data)       => api.post('/carrier-rate-cards', data).then(r => r.data),
  update:        (id, data)   => api.patch(`/carrier-rate-cards/${id}`, data).then(r => r.data),
  delete:        (id)         => api.delete(`/carrier-rate-cards/${id}`).then(r => r.data),
  clone:         (id, data)   => api.post(`/carrier-rate-cards/${id}/clone`, data).then(r => r.data),
  applyIncrease: (id, data)   => api.post(`/carrier-rate-cards/${id}/apply-increase`, data).then(r => r.data),
  activate:      (id)         => api.post(`/carrier-rate-cards/${id}/activate`).then(r => r.data),
  exportCsvUrl:  (id)         => `/api/carrier-rate-cards/${id}/export`,
  importCsv:     (data)       => api.post('/carrier-rate-cards/import', data).then(r => r.data),
  updateBand:    (bandId, data) => api.patch(`/carrier-rate-cards/bands/${bandId}`, data).then(r => r.data),
  addBand:       (cardId, data) => api.post(`/carrier-rate-cards/${cardId}/bands`, data).then(r => r.data),
  deleteBand:    (bandId)     => api.delete(`/carrier-rate-cards/bands/${bandId}`).then(r => r.data),
};
