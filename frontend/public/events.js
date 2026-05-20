window.RSVPApp = window.RSVPApp || {};

const {
  escapeHtml,
  formatDateTime,
  formatDate,
  formatCount
} = window.RSVPApp;

const responseLabel = {
  yes: 'Yes',
  no: 'No',
  maybe: 'Maybe'
};

const responseTone = {
  yes: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30',
  no: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30',
  maybe: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30'
};

const eventPoster = (event) => {
  if (!event.posterUrl) {
    return `
      <div class="ratio-16-9 flex items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800">
        <div class="text-center">
          <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-200">RS</div>
          <p class="text-sm text-slate-300">No poster yet</p>
        </div>
      </div>
    `;
  }

  return `
    <img
      src="${escapeHtml(event.posterUrl)}"
      alt="${escapeHtml(event.title)} poster"
      class="ratio-16-9 w-full rounded-3xl object-cover ring-1 ring-white/10"
      loading="lazy"
    />
  `;
};

const statChip = (label, value, tone = 'text-slate-200') => `
  <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">${escapeHtml(label)}</p>
    <p class="mt-1 text-lg font-bold ${tone}">${escapeHtml(String(value))}</p>
  </div>
`;

const renderEventCard = ({ event, mode }) => `
  <article class="card-hover panel rounded-3xl p-4">
    ${eventPoster(event)}
    <div class="mt-4 space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">${escapeHtml(event.hostName || 'Event host')}</p>
          <h3 class="mt-1 text-xl font-bold text-white">${escapeHtml(event.title)}</h3>
        </div>
        <span class="pill">${formatCount(event.rsvpCount)} RSVPs</span>
      </div>

      <p class="line-clamp-3 text-sm leading-6 text-slate-300">${escapeHtml(event.description)}</p>

      <div class="grid gap-2 text-sm text-slate-300">
        <div class="flex items-center justify-between gap-3">
          <span>When</span>
          <span class="text-slate-100">${escapeHtml(formatDateTime(event.startAt))}</span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span>Where</span>
          <span class="text-slate-100">${escapeHtml(event.location)}</span>
        </div>
        ${event.capacity ? `
          <div class="flex items-center justify-between gap-3">
            <span>Capacity</span>
            <span class="text-slate-100">${formatCount(event.capacity)}</span>
          </div>
        ` : ''}
      </div>

      <div class="flex flex-wrap gap-2 text-xs font-semibold">
        <span class="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-200">Yes ${formatCount(event.yesCount)}</span>
        <span class="rounded-full bg-rose-500/15 px-3 py-1 text-rose-200">No ${formatCount(event.noCount)}</span>
        <span class="rounded-full bg-amber-500/15 px-3 py-1 text-amber-200">Maybe ${formatCount(event.maybeCount)}</span>
      </div>

      <div class="flex flex-wrap gap-2 pt-1">
        <button data-action="open-event" data-id="${escapeHtml(event.id)}" class="btn btn-primary px-4 py-2 text-sm">Open</button>
        ${mode === 'host' ? `
          <button data-action="edit-event" data-id="${escapeHtml(event.id)}" class="btn btn-ghost px-4 py-2 text-sm">Edit</button>
          <button data-action="attendees-event" data-id="${escapeHtml(event.id)}" class="btn btn-ghost px-4 py-2 text-sm">Attendees</button>
          <button data-action="delete-event" data-id="${escapeHtml(event.id)}" class="btn btn-danger px-4 py-2 text-sm">Delete</button>
        ` : `
          <button data-action="rsvp-event" data-id="${escapeHtml(event.id)}" class="btn btn-ghost px-4 py-2 text-sm">RSVP</button>
        `}
      </div>
    </div>
  </article>
`;

const renderRsvpRow = (rsvp) => `
  <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-white">${escapeHtml(rsvp.eventTitle || 'Event')}</p>
        <p class="text-xs text-slate-400">${escapeHtml(rsvp.location || '')}</p>
      </div>
      <span class="rounded-full px-3 py-1 text-xs font-semibold ${responseTone[rsvp.response] || 'bg-slate-500/15 text-slate-200'}">
        ${responseLabel[rsvp.response] || rsvp.response}
      </span>
    </div>
    <div class="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
      <div><span class="text-slate-500">When</span><div class="text-slate-100">${escapeHtml(formatDateTime(rsvp.startAt))}</div></div>
      <div><span class="text-slate-500">Guests</span><div class="text-slate-100">${formatCount(rsvp.guestsCount)}</div></div>
      <div><span class="text-slate-500">Updated</span><div class="text-slate-100">${escapeHtml(formatDateTime(rsvp.updatedAt))}</div></div>
    </div>
    ${rsvp.notes ? `<p class="mt-3 text-sm text-slate-300">${escapeHtml(rsvp.notes)}</p>` : ''}
  </div>
`;

const renderLoadingGrid = (count = 6) => `
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    ${Array.from({ length: count }).map(() => `
      <div class="panel rounded-3xl p-4">
        <div class="skeleton ratio-16-9 rounded-3xl"></div>
        <div class="mt-4 space-y-3">
          <div class="skeleton h-5 rounded-xl"></div>
          <div class="skeleton h-4 rounded-xl w-3/4"></div>
          <div class="skeleton h-4 rounded-xl w-2/3"></div>
          <div class="skeleton h-10 rounded-2xl"></div>
        </div>
      </div>
    `).join('')}
  </div>
`;

const renderModalShell = ({ title, body, width = 'max-w-3xl' }) => `
  <div class="backdrop fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 py-6">
    <div class="panel-strong ${width} max-h-[92vh] w-full overflow-y-auto rounded-3xl scrollbar-thin">
      <div class="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
        <div>
          <h2 class="text-xl font-bold text-white">${escapeHtml(title)}</h2>
        </div>
        <button data-action="close-modal" class="btn btn-ghost px-3 py-2 text-sm">Close</button>
      </div>
      <div class="px-6 py-6">${body}</div>
    </div>
  </div>
`;

const renderLanding = () => `
  <section class="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
    <div class="space-y-6">
      <div class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
        <span class="brand-mark h-3 w-3 rounded-full"></span>
        AWS RDS, S3, Express, JWT
      </div>
      <div class="space-y-4">
        <h1 class="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl text-flow">
          RSVP Studio
        </h1>
        <p class="max-w-2xl text-lg leading-8 text-slate-300 text-flow">
          A portfolio-ready event management dashboard for hosts and guests with event CRUD, RSVP tracking, and S3 poster uploads.
        </p>
      </div>
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="panel rounded-3xl p-4">
          <div class="text-2xl font-bold text-white">CRUD</div>
          <p class="mt-1 text-sm text-slate-300">Create, update, and remove events</p>
        </div>
        <div class="panel rounded-3xl p-4">
          <div class="text-2xl font-bold text-white">RSVP</div>
          <p class="mt-1 text-sm text-slate-300">Yes, No, or Maybe with guests and notes</p>
        </div>
        <div class="panel rounded-3xl p-4">
          <div class="text-2xl font-bold text-white">S3</div>
          <p class="mt-1 text-sm text-slate-300">Poster preview and upload flow</p>
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

const renderDashboardChrome = ({ user, theme }) => `
  <div class="shell-grid">
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
        <p class="mt-2 font-semibold text-white">${escapeHtml(user.name)}</p>
        <p class="text-sm text-slate-400">${escapeHtml(user.email)}</p>
        <button data-action="logout" class="btn btn-ghost mt-4 w-full">Logout</button>
      </div>
    </aside>

    <div class="min-w-0 p-4 sm:p-6 lg:p-8">
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
              <span class="font-semibold text-white">${escapeHtml(user.name)}</span> · ${escapeHtml(user.role)}
            </div>
            <button data-action="logout" class="btn btn-ghost">Logout</button>
          </div>
        </div>
      </div>
      <div id="page-content" class="mt-6"></div>
    </div>
  </div>
`;

const renderDashboardHome = ({ state }) => {
  const totalEvents = state.events.length;
  const hostEvents = state.myEvents.length;
  const rsvpCount = state.myRsvps.length;
  const upcoming = state.events.slice(0, 3);

  return `
    <section class="grid gap-4 md:grid-cols-3">
      ${statChip('All events', totalEvents)}
      ${statChip('My RSVPs', rsvpCount)}
      ${statChip(state.user.role === 'host' ? 'Hosted events' : 'Account type', state.user.role === 'host' ? hostEvents : 'Guest')}
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
          ${upcoming.length ? upcoming.map((event) => `
            <button data-action="open-event" data-id="${escapeHtml(event.id)}" class="text-left">
              ${renderEventCard({ event, mode: state.user.role === 'host' ? 'host' : 'guest' })}
            </button>
          `).join('') : `
            <div class="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-slate-300">No events yet. Create one to get started.</div>
          `}
        </div>
      </div>

      <div class="space-y-4">
        <div class="panel rounded-3xl p-6">
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300/80">Workspace</p>
          <h2 class="mt-1 text-2xl font-bold text-white">Real-time feel</h2>
          <p class="mt-3 text-sm leading-7 text-slate-300">Updates are driven by live fetch calls, giving the dashboard a responsive app-like feel without losing simplicity.</p>
        </div>
        <div class="panel rounded-3xl p-6">
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300/80">Next action</p>
          <h2 class="mt-1 text-2xl font-bold text-white">Create a polished event</h2>
          <p class="mt-3 text-sm leading-7 text-slate-300">Add a title, poster image, and RSVP workflow for a visually complete demo.</p>
          <a href="#create" class="btn btn-primary mt-5 inline-flex">Create event</a>
        </div>
      </div>
    </section>
  `;
};

const renderEventGrid = ({ state, mode }) => `
  <section class="space-y-5">
    <div class="flex items-end justify-between gap-4">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300/80">Events</p>
        <h2 class="mt-1 text-2xl font-bold text-white">${mode === 'host' ? 'My Events' : 'Invited Events'}</h2>
      </div>
      ${state.user.role === 'host' ? `<a href="#create" class="btn btn-primary">Create event</a>` : ''}
    </div>
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      ${state.events.length ? state.events.map((event) => renderEventCard({ event, mode })).join('') : `
        <div class="panel rounded-3xl p-6 text-slate-300">No events found.</div>
      `}
    </div>
  </section>
`;

const renderMyRsvps = ({ state }) => `
  <section class="space-y-5">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300/80">Personal</p>
      <h2 class="mt-1 text-2xl font-bold text-white">My RSVPs</h2>
    </div>
    <div class="grid gap-4 lg:grid-cols-2">
      ${state.myRsvps.length ? state.myRsvps.map(renderRsvpRow).join('') : `
        <div class="panel rounded-3xl p-6 text-slate-300">You have not RSVP'd to any event yet.</div>
      `}
    </div>
  </section>
`;

const renderLoading = () => `
  <section class="space-y-5">
    <div class="skeleton h-8 w-60 rounded-2xl"></div>
    ${renderLoadingGrid(6)}
  </section>
`;

const renderCreateEventBody = ({ event = null, preview = null } = {}) => `
  <form id="event-form" class="space-y-5">
    <input type="hidden" name="eventId" value="${escapeHtml(event?.id || '')}" />
    <div class="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div class="space-y-4">
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-200">Title</label>
          <input name="title" required class="field" value="${escapeHtml(event?.title || '')}" placeholder="AWS Builder Meetup" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-200">Description</label>
          <textarea name="description" rows="5" required class="field">${escapeHtml(event?.description || '')}</textarea>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-200">Location</label>
            <input name="location" required class="field" value="${escapeHtml(event?.location || '')}" placeholder="Singapore / Online" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-200">Capacity</label>
            <input name="capacity" type="number" min="1" class="field" value="${escapeHtml(event?.capacity || '')}" placeholder="100" />
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-200">Start</label>
            <input name="startAt" type="datetime-local" required class="field" value="${escapeHtml(window.RSVPApp.toDateTimeLocalValue(event?.startAt))}" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-200">End</label>
            <input name="endAt" type="datetime-local" class="field" value="${escapeHtml(window.RSVPApp.toDateTimeLocalValue(event?.endAt))}" />
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="panel rounded-3xl p-4">
          <p class="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-sky-300/80">Poster preview</p>
          <div id="poster-preview" class="ratio-16-9 overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
            ${preview ? `<img src="${preview}" alt="Poster preview" class="h-full w-full object-cover" />` : event?.posterUrl ? `<img src="${escapeHtml(event.posterUrl)}" alt="Poster preview" class="h-full w-full object-cover" />` : `<div class="flex h-full items-center justify-center text-sm text-slate-400">Upload an image to preview</div>`}
          </div>
        </div>
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-200">Poster image</label>
          <input name="poster" type="file" accept="image/png,image/jpeg,image/webp" class="field file:mr-4 file:rounded-xl file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:font-semibold file:text-white" />
          <p class="mt-2 text-xs text-slate-500">Preview updates instantly before upload.</p>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap justify-end gap-3">
      <button type="button" data-action="close-modal" class="btn btn-ghost">Cancel</button>
      <button class="btn btn-primary">${event ? 'Update event' : 'Create event'}</button>
    </div>
  </form>
`;

const renderRsvpModalBody = (event) => `
  <div class="mb-5 rounded-3xl border border-white/10 bg-white/5 p-4">
    ${eventPoster(event)}
    <div class="mt-4">
      <p class="text-sm font-semibold text-white">${escapeHtml(event.title)}</p>
      <p class="mt-1 text-sm text-slate-300">${escapeHtml(event.location)} · ${escapeHtml(formatDateTime(event.startAt))}</p>
    </div>
  </div>

  <form id="rsvp-form" class="space-y-4">
    <input type="hidden" name="eventId" value="${escapeHtml(event.id)}" />
    <div>
      <label class="mb-2 block text-sm font-semibold text-slate-200">Response</label>
      <div class="grid grid-cols-3 gap-2">
        <button type="button" data-response="yes" class="response-choice btn btn-ghost">Yes</button>
        <button type="button" data-response="maybe" class="response-choice btn btn-ghost">Maybe</button>
        <button type="button" data-response="no" class="response-choice btn btn-ghost">No</button>
      </div>
      <input type="hidden" name="response" value="yes" />
    </div>
    <div>
      <label class="mb-2 block text-sm font-semibold text-slate-200">Guests count</label>
      <input name="guestsCount" type="number" min="1" value="1" class="field" />
    </div>
    <div>
      <label class="mb-2 block text-sm font-semibold text-slate-200">Notes</label>
      <textarea name="notes" rows="4" class="field" placeholder="Dietary needs, accessibility notes, or a friendly note"></textarea>
    </div>
    <div class="flex flex-wrap justify-end gap-3">
      <button type="button" data-action="close-modal" class="btn btn-ghost">Cancel</button>
      <button class="btn btn-primary">Save RSVP</button>
    </div>
  </form>
`;

const renderAttendeesBody = (event, attendees) => `
  <div class="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4">
    <p class="text-sm font-semibold text-white">${escapeHtml(event.title)}</p>
    <p class="mt-1 text-sm text-slate-300">${attendees.length} attendee responses</p>
  </div>
  <div class="space-y-3">
    ${attendees.length ? attendees.map((rsvp) => `
      <div class="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="font-semibold text-white">${escapeHtml(rsvp.userName)}</p>
            <p class="text-sm text-slate-400">${escapeHtml(rsvp.userEmail)}</p>
          </div>
          <span class="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-200">${escapeHtml(rsvp.response)}</span>
        </div>
        <div class="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          <div>Guests: <span class="text-white">${escapeHtml(rsvp.guestsCount)}</span></div>
          <div>Updated: <span class="text-white">${escapeHtml(formatDateTime(rsvp.updatedAt))}</span></div>
        </div>
        ${rsvp.notes ? `<p class="mt-3 text-sm text-slate-300">${escapeHtml(rsvp.notes)}</p>` : ''}
      </div>
    `).join('') : `
      <div class="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">No RSVPs yet for this event.</div>
    `}
  </div>
`;

const renderEventDetail = (event, state) => `
  <section class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
    <div class="space-y-5">
      <div class="panel rounded-3xl p-4">
        ${eventPoster(event)}
      </div>
      <div class="panel rounded-3xl p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300/80">Event detail</p>
            <h2 class="mt-1 text-3xl font-bold text-white">${escapeHtml(event.title)}</h2>
            <p class="mt-2 text-sm text-slate-400">${escapeHtml(event.hostName)} · ${escapeHtml(event.location)}</p>
          </div>
          <span class="pill">${formatCount(event.rsvpCount)} RSVPs</span>
        </div>
        <p class="mt-5 text-base leading-7 text-slate-300">${escapeHtml(event.description)}</p>
        <div class="mt-5 grid gap-3 sm:grid-cols-3">
          ${statChip('Start', formatDateTime(event.startAt))}
          ${statChip('Capacity', event.capacity || 'Open')}
          ${statChip('Host', event.hostName)}
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <div class="panel rounded-3xl p-6">
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300/80">RSVP</p>
        <h3 class="mt-1 text-2xl font-bold text-white">Respond now</h3>
        <p class="mt-3 text-sm leading-7 text-slate-300">Pick a response, add guests, and leave a note. The save action updates immediately through fetch.</p>
        <div class="mt-5 grid gap-2">
          <button data-action="rsvp-event" data-id="${escapeHtml(event.id)}" class="btn btn-primary">Yes / No / Maybe</button>
          <button data-action="attendees-event" data-id="${escapeHtml(event.id)}" class="btn btn-ghost ${state.user.role === 'host' ? '' : 'hidden'}">View attendee list</button>
          ${state.user.role === 'host' ? `<button data-action="edit-event" data-id="${escapeHtml(event.id)}" class="btn btn-ghost">Edit event</button>` : ''}
        </div>
      </div>
      <div class="panel rounded-3xl p-6">
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300/80">Response totals</p>
        <div class="mt-4 grid gap-3">
          <div class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-100">Yes: ${formatCount(event.yesCount)}</div>
          <div class="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-100">Maybe: ${formatCount(event.maybeCount)}</div>
          <div class="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-rose-100">No: ${formatCount(event.noCount)}</div>
        </div>
      </div>
    </div>
  </section>
`;

window.RSVPApp.renderEventCard = renderEventCard;
window.RSVPApp.renderRsvpRow = renderRsvpRow;
window.RSVPApp.renderLoadingGrid = renderLoadingGrid;
window.RSVPApp.renderModalShell = renderModalShell;
window.RSVPApp.renderLanding = renderLanding;
window.RSVPApp.renderDashboardChrome = renderDashboardChrome;
window.RSVPApp.renderDashboardHome = renderDashboardHome;
window.RSVPApp.renderEventGrid = renderEventGrid;
window.RSVPApp.renderMyRsvps = renderMyRsvps;
window.RSVPApp.renderLoading = renderLoading;
window.RSVPApp.renderCreateEventBody = renderCreateEventBody;
window.RSVPApp.renderRsvpModalBody = renderRsvpModalBody;
window.RSVPApp.renderAttendeesBody = renderAttendeesBody;
window.RSVPApp.renderEventDetail = renderEventDetail;
