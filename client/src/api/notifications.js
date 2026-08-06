import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Notifications module API. Identity is passed explicitly (userId) because the
// app's API routes are not behind global auth.
export const notificationsApi = {
  list:        (userId)     => api.get('/notifications', { params: { user_id: userId } }).then(r => r.data),
  markRead:    (id)         => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: (userId)     => api.post('/notifications/read-all', { user_id: userId }).then(r => r.data),
};
