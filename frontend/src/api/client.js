import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4400/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('helpdesk_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sessão expirada/token inválido em qualquer chamada = mesmo tratamento do
// login: derruba a sessão local e manda para a tela de login. Evita repetir
// essa lógica em cada componente que consome a API.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('helpdesk_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
