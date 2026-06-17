import axios from 'axios';

const api = axios.create({ baseURL: '/api/onboarding-templates' });

export const onboardingTemplatesApi = {
  // Templates
  list:        ()              => api.get('/').then(r => r.data),
  get:         (id)           => api.get(`/${id}`).then(r => r.data),
  create:      (data)         => api.post('/', data).then(r => r.data),
  update:      (id, data)     => api.patch(`/${id}`, data).then(r => r.data),
  remove:      (id)           => api.delete(`/${id}`).then(r => r.data),

  // Stages
  addStage:    (id, data)     => api.post(`/${id}/stages`, data).then(r => r.data),
  updateStage: (stageId, d)   => api.patch(`/stages/${stageId}`, d).then(r => r.data),
  deleteStage: (stageId)      => api.delete(`/stages/${stageId}`).then(r => r.data),

  // Tasks
  addTask:     (id, data)     => api.post(`/${id}/tasks`, data).then(r => r.data),
  updateTask:  (taskId, d)    => api.patch(`/tasks/${taskId}`, d).then(r => r.data),
  deleteTask:  (taskId)       => api.delete(`/tasks/${taskId}`).then(r => r.data),
  addDep:      (taskId, depends_on_id) => api.post(`/tasks/${taskId}/deps`, { depends_on_id }).then(r => r.data),
  removeDep:   (taskId, depId)=> api.delete(`/tasks/${taskId}/deps/${depId}`).then(r => r.data),

  // Comms library
  comms:       ()             => api.get('/comms').then(r => r.data),
  createComms: (data)         => api.post('/comms', data).then(r => r.data),
  updateComms: (id, data)     => api.patch(`/comms/${id}`, data).then(r => r.data),
  deleteComms: (id)           => api.delete(`/comms/${id}`).then(r => r.data),
};
