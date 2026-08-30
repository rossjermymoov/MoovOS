import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1/onboarding' });

export const onboardingApi = {
  // Board
  board:        ()                       => api.get('/board').then(r => r.data),

  // Instance lifecycle
  start:        (customerId, data)       => api.post(`/customers/${customerId}/start`, data).then(r => r.data),
  getForCustomer: (customerId)           => api.get(`/customers/${customerId}`).then(r => r.data),
  get:          (onboardingId)           => api.get(`/${onboardingId}`).then(r => r.data),
  timeline:     (onboardingId)           => api.get(`/${onboardingId}/timeline`).then(r => r.data),
  complete:     (onboardingId, body = {})=> api.post(`/${onboardingId}/complete`, body).then(r => r.data),
  setCall:      (onboardingId, body)     => api.patch(`/${onboardingId}/call`, body).then(r => r.data),
  cancel:       (onboardingId)           => api.delete(`/${onboardingId}`).then(r => r.data),
  updateCollectionDetails: (onboardingId, details) => api.patch(`/${onboardingId}/collection-details`, details).then(r => r.data),
  updateActiveTracks: (onboardingId, tracks) => api.patch(`/${onboardingId}/active-tracks`, { tracks }).then(r => r.data),
  addTrack:     (onboardingId, trackCode)=> api.post(`/${onboardingId}/add-track`, { track_code: trackCode }).then(r => r.data),

  // Tasks
  updateTask:   (taskId, data)           => api.patch(`/tasks/${taskId}`, data).then(r => r.data),
  addChecklist: (taskId, label)          => api.post(`/tasks/${taskId}/checklist`, { label }).then(r => r.data),
  toggleChecklist: (itemId, is_done, done_by) => api.patch(`/checklist/${itemId}`, { is_done, done_by }).then(r => r.data),
  deleteChecklist: (itemId)              => api.delete(`/checklist/${itemId}`).then(r => r.data),
  addNote:      (taskId, body, author_id)=> api.post(`/tasks/${taskId}/notes`, { body, author_id }).then(r => r.data),
  addAttachment:(taskId, data)           => api.post(`/tasks/${taskId}/attachments`, data).then(r => r.data),
  deleteAttachment: (attId)              => api.delete(`/attachments/${attId}`).then(r => r.data),
  sendComms:    (taskId, body = {})      => api.post(`/tasks/${taskId}/send-comms`, body).then(r => r.data),
};
