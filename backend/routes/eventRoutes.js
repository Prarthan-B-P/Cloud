import express from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  listMyEvents,
  updateEvent
} from '../controllers/eventController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const router = express.Router();

router.get('/', listEvents);
router.get('/mine', authenticate, requireRole('host'), listMyEvents);
router.get('/:id', getEvent);
router.post('/', authenticate, requireRole('host'), upload.single('poster'), createEvent);
router.put('/:id', authenticate, requireRole('host'), upload.single('poster'), updateEvent);
router.delete('/:id', authenticate, requireRole('host'), deleteEvent);

export default router;
