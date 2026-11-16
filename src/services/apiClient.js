/**
 * Cliente HTTP unificado para el Backend Netcup de DC Procesos
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const apiClient = {
  // GET
  async get(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error en la petición' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  // POST
  async post(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error en la petición' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  // PUT
  async put(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error en la petición' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  // DELETE
  async delete(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error en la petición' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }
};
