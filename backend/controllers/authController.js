import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/httpError.js';
import { JWT_SECRET } from '../config/env.js';
import { validateLoginBody, validateRegisterBody } from '../utils/validators.js';
import { UserModel } from '../models/userModel.js';

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

const signToken = (user) => jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: '7d' }
);

export const register = asyncHandler(async (req, res) => {
  const { value, errors } = validateRegisterBody(req.body);
  if (errors.length) throw new AppError('Validation failed.', 400, errors);

  const existingUser = await UserModel.findByEmail(value.email);
  if (existingUser) throw new AppError('That email is already registered.', 409);

  const passwordHash = await bcrypt.hash(value.password, 10);
  const user = await UserModel.create({
    id: randomUUID(),
    name: value.name,
    email: value.email,
    passwordHash,
    role: value.role
  });

  res.status(201).json({
    token: signToken(user),
    user: publicUser(user)
  });
});

export const login = asyncHandler(async (req, res) => {
  const { value, errors } = validateLoginBody(req.body);
  if (errors.length) throw new AppError('Validation failed.', 400, errors);

  const user = await UserModel.findByEmail(value.email);
  if (!user) throw new AppError('Invalid email or password.', 401);

  const passwordMatches = await bcrypt.compare(value.password, user.passwordHash);
  if (!passwordMatches) throw new AppError('Invalid email or password.', 401);

  res.json({
    token: signToken(user),
    user: publicUser(user)
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) throw new AppError('User account not found.', 404);

  res.json({ user: publicUser(user) });
});
