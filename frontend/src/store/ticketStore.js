import { create } from 'zustand';
import api from '../api/client';

const useTicketStore = create((set, get) => ({
  tickets: [],
  carregando: false,
  erro: null,
  filtroPrioridade: null, // null = todas

  setFiltroPrioridade(prioridade) {
    set({ filtroPrioridade: prioridade });
  },

  async carregarTickets() {
    set({ carregando: true, erro: null });
    try {
      const { filtroPrioridade } = get();
      const params = filtroPrioridade ? { prioridade: filtroPrioridade } : {};
      const { data } = await api.get('/tickets', { params });
      set({ tickets: data.tickets, carregando: false });
    } catch (err) {
      set({ erro: err.response?.data?.erro || 'Falha ao carregar chamados', carregando: false });
    }
  },

  async criarTicket({ titulo, descricao, prioridade }) {
    const { data } = await api.post('/tickets', { titulo, descricao, prioridade });
    set((state) => ({ tickets: [data.ticket, ...state.tickets] }));
    return data.ticket;
  },

  // Atualização otimista: move o card na hora (drag-and-drop precisa parecer
  // instantâneo) e desfaz se a API rejeitar a transição/permissão.
  async moverStatus(ticketId, novoStatus) {
    const anterior = get().tickets;
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticketId ? { ...t, status: novoStatus } : t)),
    }));
    try {
      const { data } = await api.patch(`/tickets/${ticketId}/status`, { status: novoStatus });
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === ticketId ? data.ticket : t)),
      }));
    } catch (err) {
      set({ tickets: anterior });
      throw err;
    }
  },

  async excluirTicket(ticketId) {
    await api.delete(`/tickets/${ticketId}`);
    set((state) => ({ tickets: state.tickets.filter((t) => t.id !== ticketId) }));
  },
}));

export default useTicketStore;
