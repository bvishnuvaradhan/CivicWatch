import axios from 'axios';

const resolveApiUrl = () => {
  const configured = (import.meta.env.VITE_API_URL || '').trim();
  if (!configured) {
    return 'http://localhost:8085/api';
  }

  const normalized = configured.replace(/\/+$/, '');
  if (normalized.endsWith('/api')) {
    return normalized;
  }
  return `${normalized}/api`;
};

const API_URL = resolveApiUrl();

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
