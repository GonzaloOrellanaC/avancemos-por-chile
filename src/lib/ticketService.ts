import fetchApi from './api';

export default {
  async getNewTicketId() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetchApi('/api/tickets/new-id', { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.message || 'No se pudo obtener ID');
    }
    return (await res.json()).ticketId;
  }
};
