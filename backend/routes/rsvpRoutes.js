import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { createOrUpdateRsvp, listEventRsvps, listMyRsvps } from '../controllers/rsvpController.js';

const router = express.Router();

router.post('/events/:eventId/rsvps', authenticate, createOrUpdateRsvp);
router.get('/events/:eventId/rsvps', authenticate, listEventRsvps);
router.get('/me/rsvps', authenticate, listMyRsvps);

export default router;
