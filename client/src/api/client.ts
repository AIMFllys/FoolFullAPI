import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
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
