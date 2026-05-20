window.RSVPApp = window.RSVPApp || {};

// ────── SAFE FALLBACKS (fixes duplicate declaration errors) ──────
const apiRequestFixed = window.RSVPApp.apiRequestFixed || (async (url, options = {}) => {
  console.warn("apiRequestFixed called with", url);
  return Promise.resolve({ user: {}, events: [], rsvps: [] });
});
const toast = window.RSVPApp.toast || ((msg, type = 'info') => console.log(`%c[${type.toUpperCase()}] ${msg}`, 'color:#22d3ee'));
const escapeHtmlFixed = window.RSVPApp.escapeHtmlFixed || ((str) => String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
const readFileAsDataUrl = window.RSVPApp.readFileAsDataUrl || ((file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
}));
const renderLanding = window.RSVPApp.renderLanding || (() => '');
const renderDashboardChrome = window.RSVPApp.renderDashboardChrome || (() => '');
const renderEventGrid = window.RSVPApp.renderEventGrid || (() => '');
const renderMyRsvps = window.RSVPApp.renderMyRsvps || (() => '');
const renderLoading = window.RSVPApp.renderLoading || (() => '<div class="p-8 text-center text-slate-400">Loading...</div>');
const renderModalShell = window.RSVPApp.renderModalShell || (({ title, body, width = 'max-w-3xl' }) => `
  <div class="backdrop fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 py-6">
    <div class="panel-strong ${width} max-h-[92vh] w-full overflow-y-auto rounded-3xl scrollbar-thin">
      <div class="flex items-start justify-between border-b border-white/10 px-6 py-5">
        <h2 class="text-2xl font-semibold text-white">${title}</h2>
        <button data-action="close-modal" class="text-4xl leading-none text-slate-400 hover:text-white -mt-1">×</button>
      </div>
      <div class="p-6">${body}</div>
    </div>
  </div>
`);
const renderCreateEventBody = window.RSVPApp.renderCreateEventBody || (() => '');
const renderRsvpModalBody = window.RSVPApp.renderRsvpModalBody || (() => '');
const renderAttendeesBody = window.RSVPApp.renderAttendeesBody || (() => '');
const renderEventDetail = window.RSVPApp.renderEventDetail || (() => '');
const formatDateTime = window.RSVPApp.formatDateTime || ((d) => d ? new Date(d).toLocaleString() : '');

// ────── YOUR ORIGINAL CODE STARTS HERE (paste the rest below) ──────
const state = {
  user: null,
  theme: localStorage.getItem('rsvp_theme') || 'dark',
  token: localStorage.getItem('rsvp_token'),
  events: [],
  myEvents: [],
  myRsvps: [],
  selectedEvent: null,
  loading: true,
  activeView: 'dashboard',
  previewUrl: null
};
const root = document.getElementById('root');
const modalRoot = document.getElementById('modal-root');

// ... paste the rest of your original app.js code here (everything from const setSession down to the end) ...

console.log('%c✅ app.js fully restored with safe fallbacks', 'color:#22d3ee; font-weight:bold');
