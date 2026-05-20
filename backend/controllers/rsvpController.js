import { randomUUID } from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/httpError.js';
import { readJSON, writeJSON } from '../store.js';

const enrichRsvp = (rsvp, allEvents, allUsers) => {
  const event = allEvents.find((e) => e.id === rsvp.eventId);
  const user = allUsers.find((u) => u.id === rsvp.userId);
  return {
    ...rsvp,
    eventTitle: event?.title,
    posterUrl: event?.posterUrl,
    location: event?.location,
    startAt: event?.startAt,
    userName: user?.name,
    userEmail: user?.email
  };
};

export const createOrUpdateRsvp = asyncHandler(async (req, res) => {
  const events = readJSON('events');
  const event = events.find((e) => e.id === req.params.eventId);
  if (!event) throw new AppError('Event not found.', 404);

  const { response, guestsCount = 1, notes = '' } = req.body;
  if (!response || !['yes', 'no', 'maybe'].includes(response)) {
    throw new AppError('Response must be yes, no, or maybe.', 400);
  }

  let rsvps = readJSON('rsvps');
  const existingIndex = rsvps.findIndex(
    (r) => r.eventId === req.params.eventId && r.userId === req.user.id
  );

  let rsvp;
  if (existingIndex !== -1) {
    rsvps[existingIndex] = {
      ...rsvps[existingIndex],
      response,
      guestsCount: Number(guestsCount),
      notes,
      updatedAt: new Date().toISOString()
    };
    rsvp = rsvps[existingIndex];
  } else {
    rsvp = {
      id: randomUUID(),
      eventId: req.params.eventId,
      userId: req.user.id,
      response,
      guestsCount: Number(guestsCount),
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    rsvps.push(rsvp);
  }
  writeJSON('rsvps', rsvps);

  const users = readJSON('users');
  res.status(201).json({ rsvp: enrichRsvp(rsvp, events, users) });
});

export const listEventRsvps = asyncHandler(async (req, res) => {
  const events = readJSON('events');
  const event = events.find((e) => e.id === req.params.eventId);
  if (!event) throw new AppError('Event not found.', 404);
  if (event.hostId !== req.user.id) throw new AppError('You can only view RSVPs for your own events.', 403);

  const rsvps = readJSON('rsvps').filter((r) => r.eventId === req.params.eventId);
  const users = readJSON('users');
  res.json({ rsvps: rsvps.map((r) => enrichRsvp(r, events, users)) });
});

export const listMyRsvps = asyncHandler(async (req, res) => {
  const rsvps = readJSON('rsvps').filter((r) => r.userId === req.user.id);
  const events = readJSON('events');
  const users = readJSON('users');
  res.json({ rsvps: rsvps.map((r) => enrichRsvp(r, events, users)) });
});
