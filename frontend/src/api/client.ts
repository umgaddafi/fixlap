/**
 * FixLab API Client
 * Connects the React frontend to the Laravel REST API on MySQL
 */

const TOKEN_KEY = 'fixlab_auth_token';
const USER_KEY = 'fixlab_auth_user';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string, remember = true) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function getStoredUser(): any | null {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any, remember = true) {
  const raw = JSON.stringify(user);
  if (remember) {
    localStorage.setItem(USER_KEY, raw);
  } else {
    sessionStorage.setItem(USER_KEY, raw);
  }
}

/**
 * Dynamic API Base URL resolution:
 * Allows multiple users, devices, and external IPs to communicate with the FixLab backend.
 * 1. Checks VITE_API_URL if explicitly configured.
 * 2. If running in a browser:
 *    - If accessed on port 8000 (direct Laravel) or standard 80/443 reverse proxy, uses relative '/api'
 *    - Otherwise, dynamically targets `${protocol}//${hostname}:8000` so any LAN IP, WiFi IP, or remote IP works cross-origin seamlessly without hardcoded localhost.
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (envUrl) {
    if (envUrl === '/api' || envUrl === '/') return '';
    return envUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location;
    // When served on backend port directly or behind unified reverse proxy
    if (port === '8000') {
      return '';
    }
    // Dynamic IP detection: use current browser hostname and backend port 8000
    // This allows devices on LAN (e.g. 192.168.1.190), custom IPs, or domains to access the API cross-origin
    return `${protocol}//${hostname}:8000`;
  }

  return '';
}

export function resolveApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = resolveApiUrl(endpoint);
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  // If response is 204 or empty
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return {} as T;
}

export const api = {
  // Authentication
  auth: {
    login: async (email: string, password: string, role?: string, remember = true) => {
      const data = await request<{ token: string; user: any; role: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      setAuthToken(data.token, remember);
      setStoredUser(data.user, remember);
      return data;
    },
    register: async (payload: { name: string; email: string; password: string; phone?: string; referral_code?: string }, remember = true) => {
      const data = await request<{ token: string; user: any; role: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAuthToken(data.token, remember);
      setStoredUser(data.user, remember);
      return data;
    },
    me: async () => {
      return request<{ user: any; role: string }>('/api/auth/me');
    },
    logout: async () => {
      try {
        await request('/api/auth/logout', { method: 'POST' });
      } finally {
        clearAuthToken();
      }
    },
  },

  // Staff Repairs
  repairs: {
    list: (params?: { status?: string; priority?: string; search?: string; technician_id?: string }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.priority) qs.set('priority', params.priority);
      if (params?.search) qs.set('search', params.search);
      if (params?.technician_id) qs.set('technician_id', params.technician_id);
      return request<any[]>(`/api/repairs?${qs.toString()}`);
    },
    get: (id: string) => request<any>(`/api/repairs/${id}`),
    create: (payload: any) => request<{ message: string; repair: any }>('/api/repairs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    update: (id: string, payload: any) => request<{ message: string; repair: any }>(`/api/repairs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
    addNote: (id: string, text: string, author?: string) => request<{ message: string; note: any }>(`/api/repairs/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ text, author }),
    }),
    getChat: (id: string) => request<any>(`/api/repairs/${id}/chat`),
    sendChat: (id: string, text: string) => request<any>(`/api/repairs/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  },

  // Client Portal Repairs
  clientRepairs: {
    list: () => request<any[]>('/api/client/repairs'),
    submit: (payload: { deviceType: string; model: string; issue: string; phone?: string; dropoffDate: string }) =>
      request<{ message: string; repair: any }>('/api/client/repairs', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Inventory & Parts
  inventory: {
    list: (params?: { category?: string; lowStock?: boolean; search?: string }) => {
      const qs = new URLSearchParams();
      if (params?.category) qs.set('category', params.category);
      if (params?.lowStock) qs.set('lowStock', '1');
      if (params?.search) qs.set('search', params.search);
      return request<any[]>(`/api/inventory?${qs.toString()}`);
    },
    restock: (id: string, quantity: number, notes?: string) =>
      request<{ message: string; item: any }>(`/api/inventory/${id}/restock`, {
        method: 'POST',
        body: JSON.stringify({ quantity, notes }),
      }),
  },

  // Technicians
  technicians: {
    list: () => request<any[]>('/api/technicians'),
    create: (payload: { name: string; email: string; phone: string; specialty: string | string[]; available?: boolean }) =>
      request<{ message: string; technician: any }>('/api/technicians', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: { name: string; email: string; phone: string; specialty: string | string[]; available?: boolean }) =>
      request<{ message: string; technician: any }>(`/api/technicians/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<{ message: string; id: string }>(`/api/technicians/${id}`, {
        method: 'DELETE',
      }),
    toggleAvailability: (id: string) =>
      request<{ message: string; technician: any }>(`/api/technicians/${id}/toggle-availability`, {
        method: 'POST',
      }),
    sendDailyReminders: () =>
      request<{ message: string; output: string }>('/api/technicians/send-daily-reminders', {
        method: 'POST',
      }),
  },

  // Customers Directory
  customers: {
    list: () => request<any[]>('/api/customers'),
    update: (id: string, payload: { name: string; email: string; phone: string }) =>
      request<{ message: string; customer: any }>(`/api/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<{ message: string; id: string }>(`/api/customers/${id}`, {
        method: 'DELETE',
      }),
  },

  // Reports
  reports: {
    summary: (params?: { month?: number; year?: number }) => {
      const qs = new URLSearchParams();
      if (params?.month) qs.set('month', String(params.month));
      if (params?.year) qs.set('year', String(params.year));
      const query = qs.toString();
      return request<any>(`/api/reports/summary${query ? `?${query}` : ''}`);
    },
    exportCsvUrl: (params?: { month?: number; year?: number }) => {
      const qs = new URLSearchParams();
      if (params?.month) qs.set('month', String(params.month));
      if (params?.year) qs.set('year', String(params.year));
      const query = qs.toString();
      return resolveApiUrl(`/api/reports/export-csv${query ? `?${query}` : ''}`);
    },
  },

  // Invoices
  invoices: {
    get: (id: string) => request<any>(`/api/invoices/${id}`),
  },

  // Payments
  payments: {
    config: () => request<{ publicKey: string; baseUrl: string }>('/api/payments/config'),
    verify: (reference: string, repairId: string, amount: number) =>
      request<{ message: string; repair: any; verified?: boolean }>('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify({ reference, repairId, amount }),
      }),
  },

  // Notifications
  notifications: {
    list: () => request<{ unreadCount: number; items: any[] }>('/api/notifications'),
  },

  // Messages
  messages: {
    threads: () => request<any[]>('/api/messages/threads'),
    send: (threadId: string, text: string) =>
      request<any>(`/api/messages/threads/${threadId}`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    markRead: (threadId: string) =>
      request<{ message: string }>(`/api/messages/threads/${threadId}/read`, {
        method: 'POST',
      }),
  },

  // Referrals
  referrals: {
    stats: () => request<any>('/api/referrals/stats'),
  },
};
