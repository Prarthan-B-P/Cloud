import type { EventItem, RsvpItem, RsvpResponse, Role, User } from './types';

const tokenKey = 'rsvp_token';

export const getToken = () => localStorage.getItem(tokenKey);
export const saveToken = (token: string) => localStorage.setItem(tokenKey, token);
export const clearToken = () => localStorage.removeItem(tokenKey);

async function readResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? response.json() : response.text();
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const body = options.body;

  if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(path, { ...options, headers });
  const data = await readResponse(response);

  if (!response.ok) {
    const details = Array.isArray(data?.details) ? ` ${data.details.join(' ')}` : '';
    throw new Error(data?.message || data?.error || `Request failed with status ${response.status}.${details}`);
  }

  return data as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  register: (payload: { name: string; email: string; password: string; role: Role }) =>
    apiRequest<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  me: () => apiRequest<{ user: User }>('/api/auth/me')
};

export const eventsApi = {
  list: () => apiRequest<{ events: EventItem[] }>('/api/events'),
  mine: () => apiRequest<{ events: EventItem[] }>('/api/events/mine'),
  create: (body: FormData) => apiRequest<{ event: EventItem }>('/api/events', { method: 'POST', body }),
  update: (id: string, body: FormData) => apiRequest<{ event: EventItem }>(`/api/events/${id}`, { method: 'PUT', body }),
  remove: (id: string) => apiRequest<{ message: string }>(`/api/events/${id}`, { method: 'DELETE' }),
  attendees: (id: string) => apiRequest<{ rsvps: RsvpItem[] }>(`/api/events/${id}/rsvps`)
};

export const rsvpApi = {
  mine: () => apiRequest<{ rsvps: RsvpItem[] }>('/api/me/rsvps'),
  save: (eventId: string, payload: { response: RsvpResponse; guestsCount: number; notes: string }) =>
    apiRequest<{ rsvp: RsvpItem }>(`/api/events/${eventId}/rsvps`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
