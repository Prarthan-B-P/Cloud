export type Role = 'host' | 'guest';
export type RsvpResponse = 'yes' | 'no' | 'maybe';
export type Theme = 'light' | 'dark';
export type View = 'home' | 'auth' | 'dashboard' | 'create' | 'event';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface EventItem {
  id: string;
  hostId: string;
  hostName: string;
  hostEmail?: string;
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt?: string | null;
  capacity?: number | null;
  posterUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  yesCount?: number;
  noCount?: number;
  maybeCount?: number;
  rsvpCount?: number;
}

export interface RsvpItem {
  id: string;
  eventId: string;
  eventTitle?: string;
  posterUrl?: string | null;
  location?: string;
  startAt?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  response: RsvpResponse;
  guestsCount: number;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppToast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
