import axios from 'axios';

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? `${window.location.protocol}//${window.location.hostname === '127.0.0.1' ? 'localhost' : 'civicwatch-api.onrender.com'}/api`
  : process.env.REACT_APP_API_URL || 'http://localhost:8085/api';

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
