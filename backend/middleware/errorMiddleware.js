import { AppError } from '../utils/httpError.js';

export const notFound = (req, res, next) => {
  const acceptsJson = (req.headers.accept || '').includes('application/json') || req.originalUrl.startsWith('/api');
  if (acceptsJson) {
    return res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
  }
  return res.status(404).send('Not found');
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const payload = { message };

  if (err.details) {
    payload.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};
