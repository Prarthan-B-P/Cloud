import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './backend/routes/authRoutes.js';
import eventRoutes from './backend/routes/eventRoutes.js';
import rsvpRoutes from './backend/routes/rsvpRoutes.js';
import { notFound, errorHandler } from './backend/middleware/errorMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, 'frontend/dist');
const frontendPublicPath = path.join(__dirname, 'frontend/public');
const frontendPath = process.env.NODE_ENV === 'production' ? frontendDistPath : frontendDistPath;

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
}));

app.use(express.static(frontendPath));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'event-rsvp-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', rsvpRoutes);

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'), (error) => {
    if (error) {
      res.sendFile(path.join(frontendPublicPath, 'index.html'));
    }
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
