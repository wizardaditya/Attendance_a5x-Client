import axios from 'axios';

// In development, Vite proxies /api → http://localhost:3001
// In production, set VITE_API_URL to your backend URL (e.g. https://worksyne-api.onrender.com)
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  timeout: 30000, // 30s — Render free tier wakes from sleep slowly
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('worksyne_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('worksyne_token');
      localStorage.removeItem('worksyne_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
