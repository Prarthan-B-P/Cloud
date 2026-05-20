import { randomUUID } from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/httpError.js';
import { readJSON, writeJSON } from '../store.js';

const normalizeCapacity = (capacity) => {
  if (capacity === null || capacity === undefined || capacity === '') return null;
  const parsed = parseInt(capacity, 10);
  return isNaN(parsed) ? null : parsed;
};

const enrichEvent = (event, allRsvps, allUsers) => {
  const eventRsvps = allRsvps.filter((r) => r.eventId === event.id);
  const host = allUsers.find((u) => u.id === event.hostId);
  return {
    ...event,
    hostName: host?.name || 'Unknown',
    hostEmail: host?.email,
    rsvpCount: eventRsvps.length,
    yesCount: eventRsvps.filter((r) => r.response === 'yes').length,
    noCount: eventRsvps.filter((r) => r.response === 'no').length,
    maybeCount: eventRsvps.filter((r) => r.response === 'maybe').length
  };
};

export const listEvents = asyncHandler(async (req, res) => {
  const events = readJSON('events');
  const rsvps = readJSON('rsvps');
  const users = readJSON('users');
  res.json({ events: events.map((e) => enrichEvent(e, rsvps, users)) });
});

export const listMyEvents = asyncHandler(async (req, res) => {
  const events = readJSON('events').filter((e) => e.hostId === req.user.id);
  const rsvps = readJSON('rsvps');
  const users = readJSON('users');
  res.json({ events: events.map((e) => enrichEvent(e, rsvps, users)) });
});

export const getEvent = asyncHandler(async (req, res) => {
  const events = readJSON('events');
  const event = events.find((e) => e.id === req.params.id);
  if (!event) throw new AppError('Event not found.', 404);
  const rsvps = readJSON('rsvps');
  const users = readJSON('users');
  res.json({ event: enrichEvent(event, rsvps, users) });
});

export const createEvent = asyncHandler(async (req, res) => {
  const { title, description, location, capacity, startAt, endAt } = req.body;
  if (!title || !startAt || !location) throw new AppError('Title, location and start date are required.', 400);

  let posterUrl = null;
  if (req.file) {
    const b64 = req.file.buffer.toString('base64');
    posterUrl = `data:${req.file.mimetype};base64,${b64}`;
  }

  const events = readJSON('events');
  const event = {
    id: randomUUID(),
    hostId: req.user.id,
    title, description, location,
    startAt, endAt: endAt || null,
    capacity: normalizeCapacity(capacity),
    posterUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  events.push(event);
  writeJSON('events', events);

  const rsvps = readJSON('rsvps');
  const users = readJSON('users');
  res.status(201).json({ event: enrichEvent(event, rsvps, users) });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const events = readJSON('events');
  const index = events.findIndex((e) => e.id === req.params.id);
  if (index === -1) throw new AppError('Event not found.', 404);
  if (events[index].hostId !== req.user.id) throw new AppError('You can only manage events you created.', 403);

  const { title, description, location, capacity, startAt, endAt } = req.body;

  let posterUrl = events[index].posterUrl;
  if (req.file) {
    const b64 = req.file.buffer.toString('base64');
    posterUrl = `data:${req.file.mimetype};base64,${b64}`;
  }

  events[index] = {
    ...events[index],
    title: title || events[index].title,
    description: description || events[index].description,
    location: location || events[index].location,
    capacity: normalizeCapacity(capacity),
    startAt: startAt || events[index].startAt,
    endAt: endAt || events[index].endAt,
    posterUrl,
    updatedAt: new Date().toISOString()
  };
  writeJSON('events', events);

  const rsvps = readJSON('rsvps');
  const users = readJSON('users');
  res.json({ event: enrichEvent(events[index], rsvps, users) });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  let events = readJSON('events');
  const event = events.find((e) => e.id === req.params.id);
  if (!event) throw new AppError('Event not found.', 404);
  if (event.hostId !== req.user.id) throw new AppError('You can only manage events you created.', 403);

  writeJSON('events', events.filter((e) => e.id !== req.params.id));
  res.json({ message: 'Event deleted successfully.' });
});
