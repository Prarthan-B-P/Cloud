window.RSVPApp = window.RSVPApp || {};

const {
  apiRequest,
  toast,
  escapeHtml,
  readFileAsDataUrl,
  renderLanding,
  renderDashboardChrome,
  renderEventGrid,
  renderMyRsvps,
  renderLoading,
  renderModalShell,
  renderCreateEventBody,
  renderRsvpModalBody,
  renderAttendeesBody,
  renderEventDetail,
  formatDateTime
} = window.RSVPApp;

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

const setSession = ({ token, user }) => {
  state.token = token;
  state.user = user;
  localStorage.setItem('rsvp_token', token);
};

const clearSession = () => {
  state.token = null;
  state.user = null;
  localStorage.removeItem('rsvp_token');
};

const applyTheme = (theme) => {
  state.theme = theme;
  localStorage.setItem('rsvp_theme', theme);
  document.body.dataset.theme = theme;
};

const openModal = (html) => {
  modalRoot.innerHTML = html;
  document.body.classList.add('overflow-hidden');
};

const closeModal = () => {
  modalRoot.innerHTML = '';
  document.body.classList.remove('overflow-hidden');
  state.previewUrl = null;
};

const loadSession = async () => {
  if (!state.token) return false;
  try {
    const response = await apiRequest('/api/auth/me');
    state.user = response.user;
    return true;
  } catch {
    clearSession();
    return false;
  }
};

const loadData = async () => {
  state.loading = true;
  renderApp();

  const [eventsResult, myRsvpsResult, myEventsResult] = await Promise.allSettled([
    apiRequest('/api/events'),
    apiRequest('/api/me/rsvps').catch(() => ({ rsvps: [] })),
    state.user?.role === 'host'
      ? apiRequest('/api/events/mine').catch(() => ({ events: [] }))
      : Promise.resolve({ events: [] })
  ]);

  state.events = eventsResult.status === 'fulfilled' ? (eventsResult.value.events || []) : [];
  state.myRsvps = myRsvpsResult.status === 'fulfilled' ? (myRsvpsResult.value.rsvps || []) : [];
  state.myEvents = myEventsResult.status === 'fulfilled' ? (myEventsResult.value.events || []) : [];
  state.loading = false;
};

const isAuthed = () => Boolean(state.user);

const viewFromHash = () => {
  const hash = window.location.hash.replace(/^#/, '') || (isAuthed() ? 'dashboard' : 'home');
  const [route, param] = hash.split('/');

  if (!isAuthed()) {
    return 'home';
  }

  if (route === 'events' && param) return `event:${param}`;
  if (route === 'create') return 'create';
  if (route === 'my-rsvps') return 'my-rsvps';
  if (route === 'events') return 'events';
  return 'dashboard';
};

const renderAuthPanel = () => `
  <section class="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
    <div class="space-y-6">
      <div class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
        <span class="brand-mark h-3 w-3 rounded-full"></span>
        AWS RDS, S3, Express, JWT
      </div>
      <div class="space-y-4">
        <h1 class="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl text-flow">RSVP Studio</h1>
        <p class="max-w-2xl text-lg leading-8 text-slate-300 text-flow">
          A polished event management system for hosts and guests, with event CRUD, RSVP flows, attendee tracking, and S3 poster uploads.
        </p>
      </div>
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="panel rounded-3xl p-4">
          <div class="text-2xl font-bold text-white">CRUD</div>
          <p class="mt-1 text-sm text-slate-300">Create, update, and remove events</p>
        </div>
        <div class="panel rounded-3xl p-4">
          <div class="text-2xl font-bold text-white">RSVP</div>
          <p class="mt-1 text-sm text-slate-300">Yes, No, or Maybe with guest counts</p>
        </div>
        <div class="panel rounded-3xl p-4">
          <div class="text-2xl font-bold text-white">S3</div>
          <p class="mt-1 text-sm text-slate-300">Poster preview before upload</p>
        </div>
      </div>
    </div>

    <div class="panel rounded-3xl p-6 shadow-glow">
      <div class="mb-5 flex rounded-2xl bg-white/5 p-1">
        <button data-auth-tab="login" class="auth-tab flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white">Login</button>
        <button data-auth-tab="register" class="auth-tab flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-slate-300">Register</button>
      </div>
      <form id="login-form" class="auth-form space-y-4">
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-200">Email</label>
          <input name="email" type="email" required class="field" placeholder="you@example.com" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-200">Password</label>
          <input name="password" type="password" required class="field" placeholder="••••••••" />
        </div>
        <button class="btn btn-primary w-full">Sign in</button>
      </form>
      <form id="register-form" class="auth-form hidden space-y-4">
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-200">Full name</label>
          <input name="name" type="text" required class="field" placeholder="Your name" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-200">Email</label>
          <input name="email" type="email" required class="field" placeholder="you@example.com" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-200">Password</label>
          <input name="password" type="password" required minlength="8" class="field" placeholder="At least 8 characters" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-200">Account type</label>
          <select name="role" class="field">
            <option value="guest">Guest</option>
            <option value="host">Host</option>
          </select>
        </div>
        <button class="btn btn-primary w-full">Create account</button>
      </form>
    </div>
  </section>
`;

const renderSidebar = () => `
  <aside class="nav-panel hidden border-r border-white/10 p-5 lg:flex lg:flex-col">
    <div class="flex items-center gap-3">
      <div class="brand-mark flex h-11 w-11 items-center justify-center rounded-2xl font-bold text-slate-950">RS</div>
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300/80">RSVP Studio</p>
        <p class="text-xs text-slate-400">Event dashboard</p>
      </div>
    </div>
    <nav class="mt-8 space-y-2 text-sm font-semibold">
      <a href="#dashboard" class="nav-link block rounded-2xl px-4 py-3 hover:bg-white/5">Dashboard</a>
      <a href="#events" class="nav-link block rounded-2xl px-4 py-3 hover:bg-white/5">Events</a>
      <a href="#create" class="nav-link block rounded-2xl px-4 py-3 hover:bg-white/5">Create Event</a>
      <a href="#my-rsvps" class="nav-link block rounded-2xl px-4 py-3 hover:bg-white/5">My RSVPs</a>
    </nav>
    <div class="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4">
      <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in as</p>
      <p class="mt-2 font-semibold text-white">${escapeHtml(state.user.name)}</p>
      <p class="text-sm text-slate-400">${escapeHtml(state.user.email)}</p>
      <button data-action="logout" class="btn btn-ghost mt-4 w-full">Logout</button>
    </div>
  </aside>
`;

const renderTopbar = () => `
  <div class="panel rounded-3xl px-5 py-5 sm:px-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex items-center gap-4">
        <button data-action="toggle-theme" class="btn btn-ghost flex h-11 w-11 items-center justify-center rounded-2xl px-0" title="Toggle theme">◐</button>
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300/80">Dashboard</p>
          <h1 class="font-display text-2xl font-bold text-white sm:text-3xl">Manage events, RSVPs, and attendees</h1>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
          <span class="font-semibold text-white">${escapeHtml(state.user.name)}</span> · ${escapeHtml(state.user.role)}
        </div>
        <button data-action="logout" class="btn btn-ghost">Logout</button>
      </div>
    </div>
  </div>
`;

const renderDashboardHomeView = () => `
  <section class="grid gap-4 md:grid-cols-3">
    ${[
      { label: 'All events', value: state.events.length },
      { label: 'My RSVPs', value: state.myRsvps.length },
      { label: state.user.role === 'host' ? 'Hosted events' : 'Account type', value: state.user.role === 'host' ? state.myEvents.length : 'Guest' }
    ].map(({ label, value }) => `
      <div class="panel rounded-3xl p-5">
        <p class="text-sm text-slate-400">${escapeHtml(label)}</p>
        <div class="mt-2 text-3xl font-bold text-white">${escapeHtml(String(value))}</div>
      </div>
    `).join('')}
  </section>

  <section class="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
    <div class="panel rounded-3xl p-6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300/80">Quick view</p>
          <h2 class="mt-1 text-2xl font-bold text-white">Upcoming events</h2>
        </div>
        <a href="#events" class="btn btn-ghost text-sm">View all</a>
      </div>
      <div class="mt-5 grid gap-4">
        ${state.events.slice(0, 3).map((event) => window.RSVPApp.renderEventCard({ event, mode: state.user.role === 'host' ? 'host' : 'guest' })).join('') || `<div class="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-slate-300">No events yet. Create one to get started.</div>`}
      </div>
    </div>

    <div class="space-y-4">
      <div class="panel rounded-3xl p-6">
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300/80">Workspace</p>
        <h2 class="mt-1 text-2xl font-bold text-white">Real-time feel</h2>
        <p class="mt-3 text-sm leading-7 text-slate-300">Everything updates from live fetch calls, keeping the app responsive and clean without adding heavy complexity.</p>
      </div>
      <div class="panel rounded-3xl p-6">
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300/80">Next action</p>
        <h2 class="mt-1 text-2xl font-bold text-white">Create a polished event</h2>
        <p class="mt-3 text-sm leading-7 text-slate-300">Add a poster image, time, venue, and RSVP workflow for a complete demo.</p>
        <a href="#create" class="btn btn-primary mt-5 inline-flex">Create event</a>
      </div>
    </div>
  </section>
`;

const renderDashboardPage = () => {
  const route = window.location.hash.replace(/^#/, '') || 'dashboard';
  const content = document.getElementById('page-content');

  if (state.loading) {
    content.innerHTML = renderLoading();
    return;
  }

  if (route.startsWith('event/')) {
    const id = route.split('/')[1];
    const event = state.events.find((item) => item.id === id);
    content.innerHTML = event ? `
      <div class="mb-4">
        <a href="#events" class="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-sky-200">Back to events</a>
      </div>
      ${window.RSVPApp.renderEventDetail(event, state)}
    ` : `<div class="panel rounded-3xl p-6">Event not found.</div>`;
    return;
  }

  if (route === 'create') {
    content.innerHTML = `
      <section class="panel rounded-3xl p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300/80">Create Event</p>
            <h2 class="mt-1 text-2xl font-bold text-white">New event</h2>
          </div>
        </div>
        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div class="panel rounded-3xl p-6">
            ${window.RSVPApp.renderCreateEventBody({})}
          </div>
        </div>
      </section>
    `;
    bindInlineCreateForm();
    return;
  }

  if (route === 'events') {
    content.innerHTML = renderEventGrid({ state, mode: state.user.role === 'host' ? 'host' : 'guest' });
    return;
  }

  if (route === 'my-rsvps') {
    content.innerHTML = renderMyRsvps({ state });
    return;
  }

  content.innerHTML = renderDashboardHomeView();
};

const renderDashboard = () => `
  <div class="shell-grid">
    ${renderSidebar()}
    <div class="min-w-0 p-4 sm:p-6 lg:p-8">
      ${renderTopbar()}
      <div id="page-content" class="mt-6"></div>
    </div>
  </div>
`;

const bindAuthForms = () => {
  const tabs = document.querySelectorAll('[data-auth-tab]');
  const forms = document.querySelectorAll('.auth-form');

  const activateTab = (tab) => {
    tabs.forEach((button) => {
      const active = button.getAttribute('data-auth-tab') === tab;
      button.classList.toggle('bg-sky-500', active);
      button.classList.toggle('text-white', active);
      button.classList.toggle('text-slate-300', !active);
    });
    forms.forEach((form) => {
      form.classList.toggle('hidden', form.id !== `${tab}-form`);
    });
  };

  tabs.forEach((button) => {
    button.addEventListener('click', () => activateTab(button.getAttribute('data-auth-tab')));
  });

  activateTab('login');
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
};

const bindDashboardHandlers = () => {
  document.querySelectorAll('[data-action="logout"]').forEach((button) => {
    button.addEventListener('click', logout);
  });
  document.querySelectorAll('[data-action="toggle-theme"]').forEach((button) => {
    button.addEventListener('click', toggleTheme);
  });
  document.querySelectorAll('[data-action="open-event"]').forEach((button) => {
    button.addEventListener('click', () => navigateToEvent(button.dataset.id));
  });
  document.querySelectorAll('[data-action="edit-event"]').forEach((button) => {
    button.addEventListener('click', () => openEditEventModal(button.dataset.id));
  });
  document.querySelectorAll('[data-action="delete-event"]').forEach((button) => {
    button.addEventListener('click', () => deleteEvent(button.dataset.id));
  });
  document.querySelectorAll('[data-action="attendees-event"]').forEach((button) => {
    button.addEventListener('click', () => openAttendeesModal(button.dataset.id));
  });
  document.querySelectorAll('[data-action="rsvp-event"]').forEach((button) => {
    button.addEventListener('click', () => openRsvpModal(button.dataset.id));
  });
  bindInlineCreateForm();
};

const bindInlineCreateForm = () => {
  const form = document.getElementById('event-form');
  if (!form) return;

  const fileInput = form.querySelector('input[name="poster"]');
  const preview = document.getElementById('poster-preview');

  if (fileInput) {
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        state.previewUrl = await readFileAsDataUrl(file);
        if (preview) {
          preview.innerHTML = `<img src="${state.previewUrl}" alt="Poster preview" class="h-full w-full object-cover" />`;
        }
      } catch (error) {
        toast(error.message, 'error');
      }
    });
  }

  form.addEventListener('submit', handleCreateOrUpdateEvent);
};

const navigateToEvent = (eventId) => {
  window.location.hash = `event/${eventId}`;
};

const openEditEventModal = (eventId) => {
  const event = state.events.find((item) => item.id === eventId) || state.myEvents.find((item) => item.id === eventId);
  if (!event) return;

  openModal(renderModalShell({
    title: 'Edit Event',
    body: renderCreateEventBody({ event, preview: event.posterUrl })
  }));

  bindCreateModalHandlers(event);
};

const openRsvpModal = (eventId) => {
  const event = state.events.find((item) => item.id === eventId);
  if (!event) return;

  openModal(renderModalShell({
    title: `RSVP for ${event.title}`,
    body: renderRsvpModalBody(event)
  }));

  bindRsvpModalHandlers(event);
};

const openAttendeesModal = async (eventId) => {
  try {
    const event = state.events.find((item) => item.id === eventId) || state.myEvents.find((item) => item.id === eventId);
    const response = await apiRequest(`/api/events/${eventId}/rsvps`);
    const attendees = response.rsvps || [];

    openModal(renderModalShell({
      title: 'Attendee list',
      body: renderAttendeesBody(event, attendees)
    }));
  } catch (error) {
    toast(error.message, 'error');
  }
};

const bindCreateModalHandlers = (event = null) => {
  document.querySelectorAll('[data-action="close-modal"]').forEach((button) => button.addEventListener('click', closeModal));
  const form = document.getElementById('event-form');
  if (!form) return;
  form.addEventListener('submit', (submitEvent) => handleCreateOrUpdateEvent(submitEvent, event));
};

const handleCreateOrUpdateEvent = async (submitEvent, event = null) => {
  submitEvent.preventDefault();
  const form = submitEvent.target;
  const formData = new FormData(form);
  const payload = new FormData();

  ['title', 'description', 'location', 'startAt', 'endAt', 'capacity'].forEach((key) => {
    payload.append(key, formData.get(key) || '');
  });

  const poster = form.querySelector('input[name="poster"]').files[0];
  if (poster) payload.append('poster', poster);

  const method = event ? 'PUT' : 'POST';
  const path = event ? `/api/events/${event.id}` : '/api/events';

  try {
    await apiRequest(path, { method, body: payload });
    toast(event ? 'Event updated successfully.' : 'Event created successfully.');
    if (event || window.location.hash === '#create') {
      window.location.hash = 'events';
    }
    await refreshAll();
  } catch (error) {
    toast(error.message, 'error');
  }
};

const bindRsvpModalHandlers = (event) => {
  document.querySelectorAll('[data-action="close-modal"]').forEach((button) => button.addEventListener('click', closeModal));
  const choices = document.querySelectorAll('.response-choice');
  const responseInput = document.querySelector('#rsvp-form input[name="response"]');
  choices.forEach((button) => {
    button.addEventListener('click', () => {
      responseInput.value = button.dataset.response;
      choices.forEach((item) => item.classList.remove('btn-primary'));
      button.classList.add('btn-primary');
    });
  });

  const form = document.getElementById('rsvp-form');
  form.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    const formData = new FormData(form);

    try {
      await apiRequest(`/api/events/${event.id}/rsvps`, {
        method: 'POST',
        body: JSON.stringify({
          response: formData.get('response'),
          guestsCount: formData.get('guestsCount'),
          notes: formData.get('notes')
        })
      });
      toast('Your RSVP has been saved.');
      closeModal();
      await refreshAll();
    } catch (error) {
      toast(error.message, 'error');
    }
  });
};

const handleLogin = async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);

  try {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password')
      })
    });
    setSession(response);
    window.location.hash = 'dashboard';
    await initializeApp();
    toast('Welcome back.');
  } catch (error) {
    toast(error.message, 'error');
  }
};

const handleRegister = async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);

  try {
    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role')
      })
    });
    setSession(response);
    window.location.hash = 'dashboard';
    await initializeApp();
    toast('Account created successfully.');
  } catch (error) {
    toast(error.message, 'error');
  }
};

const toggleTheme = () => {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  renderApp();
};

const logout = () => {
  clearSession();
  state.events = [];
  state.myEvents = [];
  state.myRsvps = [];
  state.selectedEvent = null;
  window.location.hash = 'home';
  toast('Signed out.');
  renderApp();
};

const refreshAll = async () => {
  await loadData();
  renderApp();
};

const openSelectedEvent = async () => {
  if (!isAuthed()) return;
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash.startsWith('event/')) return;

  const id = hash.split('/')[1];
  const event = state.events.find((item) => item.id === id);
  if (!event) return;

  state.selectedEvent = event;
  renderApp();
  bindDashboardHandlers();
  renderDashboardPage();
};

const renderApp = () => {
  document.body.dataset.theme = state.theme;

  if (!isAuthed()) {
    root.innerHTML = `
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        ${renderAuthPanel()}
      </div>
    `;
    bindAuthForms();
    return;
  }

  root.innerHTML = renderDashboard();
  if (state.loading) {
    const content = document.getElementById('page-content');
    if (content) {
      content.innerHTML = renderLoading();
    }
  } else {
    bindDashboardHandlers();
    renderDashboardPage();
  }
};

const initializeApp = async () => {
  applyTheme(state.theme);
  const loaded = await loadSession();
  renderApp();
  if (!loaded) return;
  await loadData();
  renderApp();
};

const handleModalBackdrop = (event) => {
  if (event.target === modalRoot.firstElementChild) {
    closeModal();
  }
};

window.addEventListener('hashchange', () => {
  if (isAuthed()) {
    renderDashboardPage();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
});

document.addEventListener('click', handleModalBackdrop);

window.addEventListener('DOMContentLoaded', initializeApp);
