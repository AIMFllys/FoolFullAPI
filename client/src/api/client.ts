import axios from 'axios';

/** Get or lazily create a persistent anonymous session ID */
function getSessionId(): string {
  let id = localStorage.getItem('sessionId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('sessionId', id);
  }
  return id;
}

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach session ID to every request (replaces JWT token)
api.interceptors.request.use((config) => {
  config.headers['X-Session-ID'] = getSessionId();
  return config;
});

// Global response interceptor: detect EVENT_ENDED and redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 410 && error.response?.data?.error?.code === 'EVENT_ENDED') {
      window.location.href = '/ended';
    }
    return Promise.reject(error);
  },
);

export default api;
