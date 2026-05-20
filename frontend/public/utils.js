window.RSVPApp = window.RSVPApp || {};

const API_BASE_URL = '';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const formatDateTime = (value) => {
  if (!value) return 'TBA';
  return new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const formatDate = (value) => {
  if (!value) return 'TBA';
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const toDateTimeLocalValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const formatCount = (value) => Number(value || 0).toLocaleString();

const safeJson = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? response.json() : response.text();
};

const setToastHost = () => {
  let host = document.getElementById('toast-root');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-root';
    host.className = 'fixed right-4 top-4 z-[80] flex w-[min(92vw,360px)] flex-col gap-2';
    document.body.appendChild(host);
  }
  return host;
};

const toast = (message, type = 'success') => {
  const host = setToastHost();
  const el = document.createElement('div');
  const colors = {
    success: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100',
    error: 'border-rose-500/40 bg-rose-500/15 text-rose-100',
    info: 'border-sky-500/40 bg-sky-500/15 text-sky-100'
  };

  el.className = `toast-enter rounded-2xl border px-4 py-3 text-sm shadow-lg ${colors[type] || colors.info}`;
  el.textContent = message;
  host.appendChild(el);

  window.setTimeout(() => {
    el.classList.remove('toast-enter');
    el.classList.add('toast-leave');
    window.setTimeout(() => el.remove(), 220);
  }, 2600);
};

const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem('rsvp_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData) && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const data = await safeJson(response);
  if (!response.ok) {
    const details = Array.isArray(data.details) ? ` ${data.details.join(' ')}` : '';
    throw new Error(data.message || data.error || `Request failed with status ${response.status}.${details}`);
  }

  return data;
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Unable to read image preview.'));
  reader.readAsDataURL(file);
});

const slugify = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

window.RSVPApp.escapeHtml = escapeHtml;
window.RSVPApp.formatDateTime = formatDateTime;
window.RSVPApp.formatDate = formatDate;
window.RSVPApp.toDateTimeLocalValue = toDateTimeLocalValue;
window.RSVPApp.formatCount = formatCount;
window.RSVPApp.toast = toast;
window.RSVPApp.apiRequest = apiRequest;
window.RSVPApp.readFileAsDataUrl = readFileAsDataUrl;
window.RSVPApp.slugify = slugify;
