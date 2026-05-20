import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './backend/routes/authRoutes.js';
import eventRoutes from './backend/routes/eventRoutes.js';
import rsvpRoutes from './backend/routes/rsvpRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, 'frontend/dist');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(frontendDistPath));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'event-rsvp-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/rsvp', rsvpRoutes);

app.get(/^\/(?!api).*/, (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(503).json({
      error: 'Frontend not built.',
      message: 'Run npm run build before starting the server in production.'
    });
  }
  res.sendFile(indexPath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
