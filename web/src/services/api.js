import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('authToken');
      // Lazy import to avoid circular dep
      import('../store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
      import('../store/chatStore').then(({ useChatStore }) => {
        useChatStore.getState().reset();
      });
    }
    return Promise.reject(err);
  }
);

export default api;
