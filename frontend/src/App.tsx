import {
  CalendarCheck,
  ChevronRight,
  Clock,
  ImagePlus,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Users,
  X
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { authApi, clearStoredUser, eventsApi, getStoredUser, rsvpApi, saveStoredUser } from './api';
import type { AppToast, EventItem, Role, RsvpItem, RsvpResponse, Theme, User, View } from './types';
import { classNames, fileToDataUrl, formatCount, formatDate, formatDateTime, toDateTimeLocal } from './utils';

interface EventFormState {
  title: string;
  description: string;
  location: string;
  capacity: string;
  startAt: string;
  endAt: string;
  poster: File | null;
}

const emptyEventForm: EventFormState = {
  title: '',
  description: '',
  location: '',
  capacity: '',
  startAt: '',
  endAt: '',
  poster: null
};

const seedForm = (event?: EventItem | null): EventFormState => ({
  title: event?.title || '',
  description: event?.description || '',
  location: event?.location || '',
  capacity: event?.capacity ? String(event.capacity) : '',
  startAt: toDateTimeLocal(event?.startAt),
  endAt: toDateTimeLocal(event?.endAt),
  poster: null
});

const responseMeta: Record<RsvpResponse, { label: string; className: string }> = {
  yes: { label: 'Yes', className: 'response-yes' },
  maybe: { label: 'Maybe', className: 'response-maybe' },
  no: { label: 'No', className: 'response-no' }
};

function App() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('rsvp_theme') as Theme) || 'dark');
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('home');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [myEvents, setMyEvents] = useState<EventItem[]>([]);
  const [myRsvps, setMyRsvps] = useState<RsvpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [eventForm, setEventForm] = useState<EventFormState>(emptyEventForm);
  const [previewUrl, setPreviewUrl] = useState('');
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [attendeeEvent, setAttendeeEvent] = useState<EventItem | null>(null);
  const [attendees, setAttendees] = useState<RsvpItem[]>([]);
  const [rsvpEvent, setRsvpEvent] = useState<EventItem | null>(null);
  const [toasts, setToasts] = useState<AppToast[]>([]);
  const [query, setQuery] = useState('');

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || myEvents.find((event) => event.id === selectedEventId) || null,
    [events, myEvents, selectedEventId]
  );

  const filteredEvents = useMemo(() => {
    const source = user?.role === 'host' && view === 'dashboard' ? myEvents : events;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return source;
    return source.filter((event) =>
      [event.title, event.location, event.hostName, event.description].some((value) =>
        String(value || '').toLowerCase().includes(normalized)
      )
    );
  }, [events, myEvents, query, user?.role, view]);

  const invitedEvents = useMemo(
    () => events.filter((event) => event.hostId !== user?.id),
    [events, user?.id]
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('rsvp_theme', theme);
  }, [theme]);

  useEffect(() => {
    const boot = async () => {
      const stored = getStoredUser();
      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.me();
        setUser(response.user);
        setView('dashboard');
        await loadData(response.user);
      } catch {
        clearStoredUser();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void boot();
  }, []);

  const notify = (message: string, type: AppToast['type'] = 'success') => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3000);
  };

  const loadData = async (activeUser = user) => {
    const [eventsResult, rsvpsResult, mineResult] = await Promise.allSettled([
      eventsApi.list(),
      activeUser ? rsvpApi.mine() : Promise.resolve({ rsvps: [] }),
      activeUser?.role === 'host' ? eventsApi.mine() : Promise.resolve({ events: [] })
    ]);

    setEvents(eventsResult.status === 'fulfilled' ? eventsResult.value.events : []);
    setMyRsvps(rsvpsResult.status === 'fulfilled' ? rsvpsResult.value.rsvps : []);
    setMyEvents(mineResult.status === 'fulfilled' ? mineResult.value.events : []);
  };

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);

    try {
      const response =
        authMode === 'login'
          ? await authApi.login(String(form.get('email')))
          : await authApi.register({
              name: String(form.get('name')),
              email: String(form.get('email')),
              role: String(form.get('role')) as Role
            });

      saveStoredUser(response.user);
      setUser(response.user);
      setView('dashboard');
      await loadData(response.user);
      notify(authMode === 'login' ? 'Welcome back.' : 'Account created.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Authentication failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    clearStoredUser();
    setUser(null);
    setEvents([]);
    setMyEvents([]);
    setMyRsvps([]);
    setSelectedEventId(null);
    setView('home');
    notify('Signed out.', 'info');
  };

  const openCreate = () => {
    setEditingEvent(null);
    setEventForm(emptyEventForm);
    setPreviewUrl('');
    setView('create');
  };

  const openEdit = (event: EventItem) => {
    setEditingEvent(event);
    setEventForm(seedForm(event));
    setPreviewUrl(event.posterUrl || '');
    setView('create');
  };

  const submitEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append('title', eventForm.title);
    formData.append('description', eventForm.description);
    formData.append('location', eventForm.location);
    formData.append('capacity', eventForm.capacity);
    formData.append('startAt', eventForm.startAt);
    formData.append('endAt', eventForm.endAt);
    if (eventForm.poster) formData.append('poster', eventForm.poster);

    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, formData);
        notify('Event updated.');
      } else {
        await eventsApi.create(formData);
        notify('Event created.');
      }
      await loadData();
      setView('dashboard');
      setEditingEvent(null);
      setPreviewUrl('');
      setEventForm(emptyEventForm);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to save event.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePosterChange = async (file?: File) => {
    if (!file) return;
    setEventForm((current) => ({ ...current, poster: file }));
    setPreviewUrl(await fileToDataUrl(file));
  };

  const deleteEvent = async (event: EventItem) => {
    const confirmed = window.confirm(`Delete "${event.title}"?`);
    if (!confirmed) return;

    try {
      await eventsApi.remove(event.id);
      notify('Event deleted.');
      await loadData();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to delete event.', 'error');
    }
  };

  const openAttendees = async (event: EventItem) => {
    setAttendeeEvent(event);
    setAttendees([]);
    try {
      const response = await eventsApi.attendees(event.id);
      setAttendees(response.rsvps);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to load attendees.', 'error');
    }
  };

  const submitRsvp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rsvpEvent) return;

    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await rsvpApi.save(rsvpEvent.id, {
        response: String(form.get('response')) as RsvpResponse,
        guestsCount: Number(form.get('guestsCount') || 1),
        notes: String(form.get('notes') || '')
      });
      setRsvpEvent(null);
      notify('RSVP saved.');
      await loadData();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to save RSVP.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEvent = (event: EventItem) => {
    setSelectedEventId(event.id);
    setView('event');
  };

  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <div className="app-shell">
      <ToastStack toasts={toasts} />
      {!user ? (
        <LandingPage
          authMode={authMode}
          saving={saving}
          onAuthMode={setAuthMode}
          onSubmit={handleAuth}
          onStart={() => setView('auth')}
          compactAuth={view === 'auth'}
        />
      ) : (
        <DashboardShell
          user={user}
          view={view}
          theme={theme}
          onTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onLogout={logout}
          onNavigate={setView}
          onCreate={openCreate}
        >
          {view === 'create' ? (
            <EventEditor
              event={editingEvent}
              form={eventForm}
              previewUrl={previewUrl}
              saving={saving}
              onChange={setEventForm}
              onPoster={handlePosterChange}
              onSubmit={submitEvent}
            />
          ) : view === 'event' && selectedEvent ? (
            <EventDetail
              event={selectedEvent}
              user={user}
              onBack={() => setView('dashboard')}
              onRsvp={setRsvpEvent}
              onAttendees={openAttendees}
              onEdit={openEdit}
            />
          ) : (
            <DashboardHome
              user={user}
              events={events}
              myEvents={myEvents}
              invitedEvents={invitedEvents}
              myRsvps={myRsvps}
              filteredEvents={filteredEvents}
              query={query}
              onQuery={setQuery}
              onCreate={openCreate}
              onOpen={openEvent}
              onEdit={openEdit}
              onDelete={deleteEvent}
              onRsvp={setRsvpEvent}
              onAttendees={openAttendees}
            />
          )}
        </DashboardShell>
      )}

      {rsvpEvent && <RsvpModal event={rsvpEvent} saving={saving} onClose={() => setRsvpEvent(null)} onSubmit={submitRsvp} />}
      {attendeeEvent && <AttendeesModal event={attendeeEvent} attendees={attendees} onClose={() => setAttendeeEvent(null)} />}
    </div>
  );
}

function FullScreenLoader() {
  return (
    <main className="full-loader">
      <Loader2 className="spin" size={38} />
      <p>Loading RSVP Studio</p>
    </main>
  );
}

function ToastStack({ toasts }: { toasts: AppToast[] }) {
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={classNames('toast', `toast-${toast.type}`)}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function LandingPage({
  authMode,
  saving,
  compactAuth,
  onAuthMode,
  onSubmit,
  onStart
}: {
  authMode: 'login' | 'register';
  saving: boolean;
  compactAuth: boolean;
  onAuthMode: (mode: 'login' | 'register') => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStart: () => void;
}) {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <button className="brand-button" onClick={() => onAuthMode('login')}>
          <span className="brand-mark">RS</span>
          RSVP Studio
        </button>
        <button className="button ghost compact" onClick={onStart}>
          Sign in
        </button>
      </nav>

      <section className={classNames('hero', compactAuth && 'hero-auth-focus')}>
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={16} />
            Express + JSON Storage · No passwords needed
          </div>
          <h1>RSVP Studio</h1>
          <p>
            A modern event management workspace for hosts and guests, with polished RSVP flows, poster uploads, attendee
            lists, and dashboard-ready metrics.
          </p>
          <div className="hero-actions">
            <button className="button primary" onClick={onStart}>
              Get started
              <ChevronRight size={18} />
            </button>
            <button className="button ghost" onClick={() => onAuthMode('register')}>
              Create host account
            </button>
          </div>
          <div className="metric-strip">
            <MiniMetric label="Event CRUD" value="Live" />
            <MiniMetric label="Poster Upload" value="S3" />
            <MiniMetric label="Guest Flow" value="RSVP" />
          </div>
        </div>

        <AuthPanel authMode={authMode} saving={saving} onAuthMode={onAuthMode} onSubmit={onSubmit} />
      </section>
    </main>
  );
}

function AuthPanel({
  authMode,
  saving,
  onAuthMode,
  onSubmit
}: {
  authMode: 'login' | 'register';
  saving: boolean;
  onAuthMode: (mode: 'login' | 'register') => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="auth-panel">
      <div className="segmented">
        <button className={authMode === 'login' ? 'active' : ''} onClick={() => onAuthMode('login')}>
          Login
        </button>
        <button className={authMode === 'register' ? 'active' : ''} onClick={() => onAuthMode('register')}>
          Register
        </button>
      </div>
      <form className="form-grid" onSubmit={onSubmit}>
        {authMode === 'register' && (
          <label>
            Full name
            <input name="name" required placeholder="Avery Stone" />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" required placeholder="you@example.com" />
        </label>
        {authMode === 'register' && (
          <label>
            Account type
            <select name="role" defaultValue="host">
              <option value="host">Host (create events)</option>
              <option value="guest">Guest (join events)</option>
            </select>
          </label>
        )}
        <button className="button primary full" disabled={saving}>
          {saving ? <Loader2 className="spin" size={18} /> : null}
          {authMode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </section>
  );
}

function DashboardShell({
  user,
  view,
  theme,
  children,
  onTheme,
  onLogout,
  onNavigate,
  onCreate
}: {
  user: User;
  view: View;
  theme: Theme;
  children: React.ReactNode;
  onTheme: () => void;
  onLogout: () => void;
  onNavigate: (view: View) => void;
  onCreate: () => void;
}) {
  return (
    <main className="dashboard-layout">
      <aside className="sidebar">
        <button className="brand-button">
          <span className="brand-mark">RS</span>
          RSVP Studio
        </button>
        <nav className="nav-list">
          <NavButton active={view === 'dashboard'} icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => onNavigate('dashboard')} />
          <NavButton active={view === 'create'} icon={<Plus size={18} />} label="Create Event" onClick={onCreate} />
        </nav>
        <div className="profile-card">
          <p>Signed in as</p>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
          <button className="button ghost full" onClick={onLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>Manage events, RSVPs, and attendees</h2>
          </div>
          <div className="topbar-actions">
            <span className="role-pill">{user.role}</span>
            <button className="icon-button" onClick={onTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="button primary compact" onClick={onCreate}>
              <Plus size={16} />
              New event
            </button>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={classNames('nav-button', active && 'active')} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function DashboardHome(props: {
  user: User;
  events: EventItem[];
  myEvents: EventItem[];
  invitedEvents: EventItem[];
  myRsvps: RsvpItem[];
  filteredEvents: EventItem[];
  query: string;
  onQuery: (query: string) => void;
  onCreate: () => void;
  onOpen: (event: EventItem) => void;
  onEdit: (event: EventItem) => void;
  onDelete: (event: EventItem) => void;
  onRsvp: (event: EventItem) => void;
  onAttendees: (event: EventItem) => void;
}) {
  const { user, events, myEvents, invitedEvents, myRsvps, filteredEvents } = props;
  const featured = events[0];

  return (
    <div className="page-stack">
      <section className="stats-grid">
        <StatCard icon={<CalendarCheck />} label="All events" value={events.length} />
        <StatCard icon={<Users />} label={user.role === 'host' ? 'My events' : 'Invited events'} value={user.role === 'host' ? myEvents.length : invitedEvents.length} />
        <StatCard icon={<ListChecks />} label="My RSVPs" value={myRsvps.length} />
      </section>

      {featured && (
        <section className="feature-panel">
          <div>
            <p className="eyebrow">Next on the calendar</p>
            <h3>{featured.title}</h3>
            <p>{featured.description}</p>
            <button className="button primary compact" onClick={() => props.onOpen(featured)}>
              Open event
              <ChevronRight size={16} />
            </button>
          </div>
          <Poster event={featured} />
        </section>
      )}

      <section className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{user.role === 'host' ? 'My Events' : 'Invited Events'}</p>
            <h3>{user.role === 'host' ? 'Host dashboard' : 'Guest dashboard'}</h3>
          </div>
          <label className="search-field">
            <Search size={17} />
            <input value={props.query} onChange={(event) => props.onQuery(event.target.value)} placeholder="Search events" />
          </label>
        </div>
        <div className="event-grid">
          {filteredEvents.length ? (
            filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                user={user}
                onOpen={props.onOpen}
                onEdit={props.onEdit}
                onDelete={props.onDelete}
                onRsvp={props.onRsvp}
                onAttendees={props.onAttendees}
              />
            ))
          ) : (
            <EmptyState title="No events found" action={user.role === 'host' ? 'Create event' : undefined} onAction={props.onCreate} />
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <article className="stat-card">
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EventCard(props: {
  event: EventItem;
  user: User;
  onOpen: (event: EventItem) => void;
  onEdit: (event: EventItem) => void;
  onDelete: (event: EventItem) => void;
  onRsvp: (event: EventItem) => void;
  onAttendees: (event: EventItem) => void;
}) {
  const { event, user } = props;
  const isOwner = user.id === event.hostId;

  return (
    <article className="event-card">
      <Poster event={event} />
      <div className="event-body">
        <div className="event-title-row">
          <div>
            <p>{event.hostName || 'Event host'}</p>
            <h4>{event.title}</h4>
          </div>
          <span>{formatCount(event.rsvpCount)} RSVPs</span>
        </div>
        <p className="event-description">{event.description}</p>
        <div className="meta-grid">
          <span>
            <Clock size={15} />
            {formatDateTime(event.startAt)}
          </span>
          <span>
            <Users size={15} />
            {event.capacity ? `${formatCount(event.capacity)} capacity` : 'Open capacity'}
          </span>
        </div>
        <ResponseBar event={event} />
        <div className="card-actions">
          <button className="button primary compact" onClick={() => props.onOpen(event)}>
            Open
          </button>
          {isOwner ? (
            <>
              <button className="button ghost compact" onClick={() => props.onAttendees(event)}>
                Attendees
              </button>
              <button className="button ghost compact" onClick={() => props.onEdit(event)}>
                Edit
              </button>
              <button className="button danger compact" onClick={() => props.onDelete(event)}>
                Delete
              </button>
            </>
          ) : (
            <button className="button ghost compact" onClick={() => props.onRsvp(event)}>
              RSVP
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Poster({ event }: { event: EventItem }) {
  const [failed, setFailed] = useState(false);

  if (event.posterUrl && !failed) {
    return <img className="poster" src={event.posterUrl} alt={`${event.title} poster`} onError={() => setFailed(true)} />;
  }

  return (
    <div className="poster poster-empty">
      <ImagePlus size={30} />
      <span>No poster yet</span>
    </div>
  );
}

function ResponseBar({ event }: { event: EventItem }) {
  return (
    <div className="response-row">
      <span className="response-yes">Yes {formatCount(event.yesCount)}</span>
      <span className="response-maybe">Maybe {formatCount(event.maybeCount)}</span>
      <span className="response-no">No {formatCount(event.noCount)}</span>
    </div>
  );
}

function EventEditor({
  event,
  form,
  previewUrl,
  saving,
  onChange,
  onPoster,
  onSubmit
}: {
  event: EventItem | null;
  form: EventFormState;
  previewUrl: string;
  saving: boolean;
  onChange: (form: EventFormState) => void;
  onPoster: (file?: File) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const setField = (key: keyof EventFormState, value: string) => onChange({ ...form, [key]: value });

  return (
    <section className="content-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Create Event</p>
          <h3>{event ? 'Edit event details' : 'Build a new event'}</h3>
        </div>
      </div>
      <form className="event-editor" onSubmit={onSubmit}>
        <div className="form-grid">
          <label>
            Title
            <input required value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="AWS Builder Meetup" />
          </label>
          <label>
            Description
            <textarea required rows={6} value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Describe the event experience, agenda, and audience." />
          </label>
          <div className="two-col">
            <label>
              Location
              <input required value={form.location} onChange={(event) => setField('location', event.target.value)} placeholder="Mumbai / Online" />
            </label>
            <label>
              Capacity
              <input type="number" min="1" value={form.capacity} onChange={(event) => setField('capacity', event.target.value)} placeholder="120" />
            </label>
          </div>
          <div className="two-col">
            <label>
              Start
              <input required type="datetime-local" value={form.startAt} onChange={(event) => setField('startAt', event.target.value)} />
            </label>
            <label>
              End
              <input type="datetime-local" value={form.endAt} onChange={(event) => setField('endAt', event.target.value)} />
            </label>
          </div>
        </div>

        <aside className="upload-panel">
          <div className="preview-frame">
            {previewUrl ? <img src={previewUrl} alt="Poster preview" /> : <div><ImagePlus size={36} /><span>Poster preview</span></div>}
          </div>
          <label className="file-drop">
            <ImagePlus size={18} />
            Upload poster
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onPoster(event.target.files?.[0])} />
          </label>
          <button className="button primary full" disabled={saving}>
            {saving ? <Loader2 className="spin" size={18} /> : null}
            {event ? 'Update event' : 'Create event'}
          </button>
        </aside>
      </form>
    </section>
  );
}

function EventDetail(props: {
  event: EventItem;
  user: User;
  onBack: () => void;
  onRsvp: (event: EventItem) => void;
  onAttendees: (event: EventItem) => void;
  onEdit: (event: EventItem) => void;
}) {
  const { event, user } = props;
  const isOwner = user.id === event.hostId;

  return (
    <section className="detail-grid">
      <div className="content-panel detail-main">
        <button className="button ghost compact" onClick={props.onBack}>
          Back
        </button>
        <Poster event={event} />
        <p className="eyebrow">Event detail</p>
        <h3>{event.title}</h3>
        <p>{event.description}</p>
        <div className="detail-facts">
          <MiniMetric label="Date" value={formatDate(event.startAt)} />
          <MiniMetric label="Location" value={event.location} />
          <MiniMetric label="Host" value={event.hostName} />
        </div>
      </div>
      <aside className="content-panel detail-side">
        <p className="eyebrow">RSVP</p>
        <h3>Respond to this event</h3>
        <ResponseBar event={event} />
        <button className="button primary full" onClick={() => props.onRsvp(event)}>
          Yes / No / Maybe
        </button>
        {isOwner && (
          <>
            <button className="button ghost full" onClick={() => props.onAttendees(event)}>
              <Users size={17} />
              View attendees
            </button>
            <button className="button ghost full" onClick={() => props.onEdit(event)}>
              Edit event
            </button>
          </>
        )}
      </aside>
    </section>
  );
}

function RsvpModal({ event, saving, onClose, onSubmit }: { event: EventItem; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [response, setResponse] = useState<RsvpResponse>('yes');

  return (
    <div className="modal-backdrop">
      <section className="modal">
        <ModalHeader title={`RSVP for ${event.title}`} onClose={onClose} />
        <form className="form-grid" onSubmit={onSubmit}>
          <div className="choice-grid">
            {(Object.keys(responseMeta) as RsvpResponse[]).map((option) => (
              <button key={option} type="button" className={classNames('choice', response === option && 'active', responseMeta[option].className)} onClick={() => setResponse(option)}>
                {responseMeta[option].label}
              </button>
            ))}
          </div>
          <input type="hidden" name="response" value={response} />
          <label>
            Guests count
            <input name="guestsCount" type="number" min="1" defaultValue="1" />
          </label>
          <label>
            Notes
            <textarea name="notes" rows={4} placeholder="Dietary notes, accessibility needs, or a message to the host" />
          </label>
          <button className="button primary full" disabled={saving}>
            {saving ? <Loader2 className="spin" size={18} /> : null}
            Save RSVP
          </button>
        </form>
      </section>
    </div>
  );
}

function AttendeesModal({ event, attendees, onClose }: { event: EventItem; attendees: RsvpItem[]; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="modal modal-wide">
        <ModalHeader title={`${event.title} attendees`} onClose={onClose} />
        <div className="attendee-list">
          {attendees.length ? (
            attendees.map((attendee) => (
              <article key={attendee.id} className="attendee-row">
                <div>
                  <strong>{attendee.userName}</strong>
                  <span>{attendee.userEmail}</span>
                </div>
                <span className={responseMeta[attendee.response]?.className}>{responseMeta[attendee.response]?.label || attendee.response}</span>
                <span>{formatCount(attendee.guestsCount)} guests</span>
                <span>{formatDateTime(attendee.updatedAt)}</span>
              </article>
            ))
          ) : (
            <EmptyState title="No attendees yet" />
          )}
        </div>
      </section>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <header className="modal-header">
      <h3>{title}</h3>
      <button className="icon-button" onClick={onClose} aria-label="Close modal">
        <X size={18} />
      </button>
    </header>
  );
}

function EmptyState({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="empty-state">
      <CalendarCheck size={30} />
      <p>{title}</p>
      {action && <button className="button primary compact" onClick={onAction}>{action}</button>}
    </div>
  );
}

export default App;
