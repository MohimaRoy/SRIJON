import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // sends HttpOnly cookies automatically on every request
  headers: {
    'Content-Type': 'application/json'
  }
});

// Inject Authorization Bearer token + fix multipart uploads
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // If sending FormData, let the browser set Content-Type automatically
  // (it needs to add the multipart boundary — do NOT force application/json)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});
// Response interceptor — handle global 401 (session expired / cookie invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Notify AuthContext to clear the user state
      window.dispatchEvent(new Event('auth-token-removed'));
    }
    return Promise.reject(error);
  }
);

export default api;
