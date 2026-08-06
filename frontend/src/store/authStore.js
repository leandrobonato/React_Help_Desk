import { create } from 'zustand';
import api from '../api/client';

const useAuthStore = create((set, get) => ({
  usuario: null,
  token: localStorage.getItem('helpdesk_token'),
  carregando: true,

  async carregarSessao() {
    const token = localStorage.getItem('helpdesk_token');
    if (!token) {
      set({ carregando: false });
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      set({ usuario: data.usuario, token, carregando: false });
    } catch {
      localStorage.removeItem('helpdesk_token');
      set({ usuario: null, token: null, carregando: false });
    }
  },

  async login(email, senha) {
    const { data } = await api.post('/auth/login', { email, senha });
    localStorage.setItem('helpdesk_token', data.token);
    set({ usuario: data.usuario, token: data.token });
    return data.usuario;
  },

  async registrar(nome, email, senha) {
    const { data } = await api.post('/auth/registro', { nome, email, senha });
    localStorage.setItem('helpdesk_token', data.token);
    set({ usuario: data.usuario, token: data.token });
    return data.usuario;
  },

  logout() {
    localStorage.removeItem('helpdesk_token');
    set({ usuario: null, token: null });
  },

  estaAutenticado: () => !!get().token,
}));

export default useAuthStore;
