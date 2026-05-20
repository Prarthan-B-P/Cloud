import { randomUUID } from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/httpError.js';
import { validateEventBody } from '../utils/validators.js';
import { EventModel } from '../models/eventModel.js';
import { uploadEventPoster } from '../services/s3Service.js';

const ensureEventOwnership = (event, user) => {
  if (!event) {
    throw new AppError('Event not found.', 404);
  }

  if (event.hostId !== user.id) {
    throw new AppError('You can only manage events you created.', 403);
  }
};

const normalizeCapacity = (capacity) => {
  if (capacity === null || capacity === undefined || capacity === '') return null;
  const parsed = Number.parseInt(capacity, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const listEvents = asyncHandler(async (req, res) => {
  const events = await EventModel.listAll();
  res.json({ events });
});

export const listMyEvents = asyncHandler(async (req, res) => {
  const events = await EventModel.listByHost(req.user.id);
  res.json({ events });
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await EventModel.findById(req.params.id);
  if (!event) throw new AppError('Event not found.', 404);

  res.json({ event });
});

export const createEvent = asyncHandler(async (req, res) => {
  const { value, errors } = validateEventBody(req.body);
  if (errors.length) throw new AppError('Validation failed.', 400, errors);

  const posterUrl = req.file ? await uploadEventPoster(req.file) : value.posterUrl;

  const event = await EventModel.create({
    id: randomUUID(),
    hostId: req.user.id,
    title: value.title,
    description: value.description,
    location: value.location,
    startAt: value.startAt,
    endAt: value.endAt,
    capacity: normalizeCapacity(value.capacity),
    posterUrl
  });

  res.status(201).json({ event });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await EventModel.findById(req.params.id);
  ensureEventOwnership(event, req.user);

  const { value, errors } = validateEventBody(req.body);
  if (errors.length) throw new AppError('Validation failed.', 400, errors);

  const posterUrl = req.file ? await uploadEventPoster(req.file) : value.posterUrl;

  const updated = await EventModel.update(req.params.id, {
    title: value.title,
    description: value.description,
    location: value.location,
    startAt: value.startAt,
    endAt: value.endAt,
    capacity: normalizeCapacity(value.capacity),
    posterUrl: posterUrl || event.posterUrl
  });

  res.json({ event: updated });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await EventModel.findById(req.params.id);
  ensureEventOwnership(event, req.user);

  await EventModel.remove(req.params.id);
  res.json({ message: 'Event deleted successfully.' });
});
