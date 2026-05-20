import { randomUUID } from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/httpError.js';
import { readJSON, writeJSON } from '../store.js';

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, role = 'guest' } = req.body;
  if (!name || !email) throw new AppError('Name and email are required.', 400);
  if (!['host', 'guest'].includes(role)) throw new AppError('Role must be host or guest.', 400);

  const users = readJSON('users');
  if (users.find((u) => u.email === email)) {
    throw new AppError('That email is already registered.', 409);
  }

  const user = { id: randomUUID(), name, email, role, createdAt: new Date().toISOString() };
  users.push(user);
  writeJSON('users', users);

  res.status(201).json({ user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('Email is required.', 400);

  const users = readJSON('users');
  const user = users.find((u) => u.email === email);
  if (!user) throw new AppError('No account found with that email. Please register first.', 404);

  res.json({ user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
