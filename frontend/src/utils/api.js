import axios from 'axios';

const backendBaseUrl =
  process.env.REACT_APP_API_BASE_URL?.trim() || 'http://localhost:8080/api';
const aiBaseUrl =
  process.env.REACT_APP_AI_BASE_URL?.trim() || 'http://localhost:8001';

// Spring Boot backend base URL
const api = axios.create({
  baseURL: backendBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear session and go to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userMeta');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Python FastAPI AI service
export const aiApi = axios.create({
  baseURL: aiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});
