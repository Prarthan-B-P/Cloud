window.RSVPApp = window.RSVPApp || {};

(function() {
  'use strict';

  // Safe references (prevents "already declared" errors)
  const formatCount = window.RSVPApp.formatCount || ((n) => n || 0);
  const formatDateTime = window.RSVPApp.formatDateTime || ((d) => d ? new Date(d).toLocaleString() : '');
  const escapeHtmlFixed = window.RSVPApp.escapeHtmlFixed || ((str) => String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));

  const responseLabel = { yes: 'Yes', no: 'No', maybe: 'Maybe' };
  const responseTone = {
    yes: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30',
    no: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30',
    maybe: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30'
  };

  const eventPoster = (event) => {
    if (!event?.posterUrl) {
      return `<div class="ratio-16-9 flex items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800"><div class="text-center"><div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-200">RS</div><p class="text-sm text-slate-300">No poster yet</p></div></div>`;
    }
    return `<img src="${event.posterUrl}" class="ratio-16-9 w-full rounded-3xl object-cover ring-1 ring-white/10" loading="lazy" alt="${escapeHtmlFixed(event.title)}" />`;
  };

  const renderEventCard = ({ event, mode = 'guest' }) => `
    <article class="card-hover panel rounded-3xl p-4 transition-all hover:-translate-y-1 cursor-pointer" data-action="open-event" data-id="${event.id}">
      ${eventPoster(event)}
      <div class="mt-4 space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <h3 class="font-semibold text-white line-clamp-2">${escapeHtmlFixed(event.title)}</h3>
            <p class="text-sm text-slate-400 mt-1">${formatDateTime(event.startAt)}</p>
          </div>
          <span class="pill whitespace-nowrap">${formatCount(event.rsvpCount)} RSVPs</span>
        </div>
        ${event.location ? `<div class="text-sm text-slate-300 flex items-center gap-2">📍 ${escapeHtmlFixed(event.location)}</div>` : ''}
        <div class="flex flex-wrap gap-2 text-xs font-semibold">
          <span class="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-200">Yes ${formatCount(event.yesCount)}</span>
          <span class="rounded-full bg-rose-500/15 px-3 py-1 text-rose-200">No ${formatCount(event.noCount)}</span>
          <span class="rounded-full bg-amber-500/15 px-3 py-1 text-amber-200">Maybe ${formatCount(event.maybeCount)}</span>
        </div>
        ${mode === 'host' ? `
          <div class="flex gap-2 pt-3 border-t border-white/10">
            <button data-action="edit-event" data-id="${event.id}" class="btn btn-ghost flex-1 text-xs py-2">Edit</button>
            <button data-action="attendees-event" data-id="${event.id}" class="btn btn-ghost flex-1 text-xs py-2">Attendees</button>
          </div>` : `
          <button data-action="rsvp-event" data-id="${event.id}" class="btn btn-primary w-full mt-3">RSVP Now</button>`}
      </div>
    </article>
  `;

  const renderRsvpRow = (rsvp) => `
    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div class="flex justify-between items-start">
        <div>
          <div class="font-medium">${escapeHtmlFixed(rsvp.userName || 'Guest')}</div>
          <div class="text-sm text-slate-400">${escapeHtmlFixed(rsvp.userEmail || '')}</div>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-semibold ${responseTone[rsvp.response] || 'bg-slate-500/15 text-slate-200'}">
          ${responseLabel[rsvp.response] || rsvp.response}
        </span>
      </div>
      ${rsvp.guestsCount ? `<div class="text-sm text-slate-300 mt-2">+${rsvp.guestsCount} guests</div>` : ''}
      ${rsvp.notes ? `<div class="mt-3 text-sm italic text-slate-400">"${escapeHtmlFixed(rsvp.notes)}"</div>` : ''}
    </div>
  `;

  const renderModalShell = ({ title, body, width = 'max-w-3xl' }) => `
    <div class="backdrop fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 py-6">
      <div class="panel-strong ${width} max-h-[92vh] w-full overflow-y-auto rounded-3xl scrollbar-thin">
        <div class="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <h2 class="text-2xl font-semibold text-white">${title}</h2>
          <button data-action="close-modal" class="text-4xl leading-none text-slate-400 hover:text-white -mt-1">×</button>
        </div>
        <div class="p-6">${body}</div>
      </div>
    </div>
  `;

  // Expose functions safely
  window.RSVPApp.renderEventCard = renderEventCard;
  window.RSVPApp.renderRsvpRow = renderRsvpRow;
  window.RSVPApp.renderModalShell = renderModalShell;
  window.RSVPApp.eventPoster = eventPoster;

  console.log('%c✅ events.js FIXED and loaded safely', 'color:#22d3ee; font-weight:bold');
})();
