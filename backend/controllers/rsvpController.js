import { randomUUID } from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/httpError.js';
import { validateRsvpBody } from '../utils/validators.js';
import { EventModel } from '../models/eventModel.js';
import { RsvpModel } from '../models/rsvpModel.js';

export const createOrUpdateRsvp = asyncHandler(async (req, res) => {
  const event = await EventModel.findById(req.params.eventId);
  if (!event) throw new AppError('Event not found.', 404);

  const { value, errors } = validateRsvpBody(req.body);
  if (errors.length) throw new AppError('Validation failed.', 400, errors);

  const rsvp = await RsvpModel.upsertForUser({
    id: randomUUID(),
    eventId: req.params.eventId,
    userId: req.user.id,
    response: value.response,
    guestsCount: value.guestsCount,
    notes: value.notes
  });

  res.status(201).json({ rsvp });
});

export const listEventRsvps = asyncHandler(async (req, res) => {
  const event = await EventModel.findById(req.params.eventId);
  if (!event) throw new AppError('Event not found.', 404);
  if (event.hostId !== req.user.id) throw new AppError('You can only view RSVPs for your own events.', 403);

  const rsvps = await RsvpModel.listByEvent(req.params.eventId);
  res.json({ rsvps });
});

export const listMyRsvps = asyncHandler(async (req, res) => {
  const rsvps = await RsvpModel.listByUser(req.user.id);
  res.json({ rsvps });
});
