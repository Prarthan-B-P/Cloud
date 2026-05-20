import { readJSON } from '../store.js';
import { AppError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) throw new AppError('Not authenticated.', 401);

  const users = readJSON('users');
  const user = users.find((u) => u.id === userId);
  if (!user) throw new AppError('User not found.', 401);

  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  return next();
};
