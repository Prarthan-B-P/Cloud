import type { EventItem, Role, RsvpItem, RsvpResponse, User } from './types';

const userKey = 'rsvp_user';

export const getStoredUser = (): User | null => {
  try { return JSON.parse(localStorage.getItem(userKey) || 'null'); } catch { return null; }
};
export const saveStoredUser = (user: User) => localStorage.setItem(userKey, JSON.stringify(user));
export const clearStoredUser = () => localStorage.removeItem(userKey);

// Keep these as no-ops so existing imports don't break
export const getToken = () => getStoredUser()?.id ?? null;
export const saveToken = (_token: string) => {};
export const clearToken = () => clearStoredUser();

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

  const user = getStoredUser();
  if (user) headers.set('x-user-id', user.id);

  const response = await fetch(path, { ...options, headers });
  const data = await readResponse(response);

  if (!response.ok) {
    const details = Array.isArray(data?.details) ? ` ${data.details.join(' ')}` : '';
    throw new Error(data?.message || data?.error || `Request failed with status ${response.status}.${details}`);
  }

  return data as T;
}

export const authApi = {
  login: (email: string) =>
    apiRequest<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
  register: (payload: { name: string; email: string; role: Role }) =>
    apiRequest<{ user: User }>('/api/auth/register', {
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
  attendees: (id: string) => apiRequest<{ rsvps: RsvpItem[] }>(`/api/rsvp/events/${id}/rsvps`)
};

export const rsvpApi = {
  mine: () => apiRequest<{ rsvps: RsvpItem[] }>('/api/rsvp/me/rsvps'),
  save: (eventId: string, payload: { response: RsvpResponse; guestsCount: number; notes: string }) =>
    apiRequest<{ rsvp: RsvpItem }>(`/api/rsvp/events/${eventId}/rsvps`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
