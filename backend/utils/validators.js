const trimText = (value) => (typeof value === 'string' ? value.trim() : '');

const parseInteger = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const validateRegisterBody = (body) => {
  const errors = [];
  const name = trimText(body.name);
  const email = trimText(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const role = trimText(body.role).toLowerCase() || 'guest';

  if (!name || name.length < 2) errors.push('Name must be at least 2 characters.');
  if (!email || !email.includes('@')) errors.push('A valid email address is required.');
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters.');
  if (!['guest', 'host'].includes(role)) errors.push('Role must be guest or host.');

  return { value: { name, email, password, role }, errors };
};

export const validateLoginBody = (body) => {
  const errors = [];
  const email = trimText(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !email.includes('@')) errors.push('A valid email address is required.');
  if (!password) errors.push('Password is required.');

  return { value: { email, password }, errors };
};

export const validateEventBody = (body) => {
  const errors = [];
  const title = trimText(body.title);
  const description = trimText(body.description);
  const location = trimText(body.location);
  const startAt = trimText(body.startAt);
  const endAt = trimText(body.endAt);
  const posterUrl = trimText(body.posterUrl);
  const capacity = parseInteger(body.capacity, null);

  if (!title || title.length < 3) errors.push('Title must be at least 3 characters.');
  if (!description || description.length < 10) errors.push('Description must be at least 10 characters.');
  if (!location || location.length < 2) errors.push('Location is required.');
  if (!startAt) errors.push('Start date and time are required.');
  if (capacity !== null && capacity < 1) errors.push('Capacity must be at least 1.');
  if (posterUrl && !/^https?:\/\//i.test(posterUrl)) errors.push('Poster URL must be a valid URL.');

  return {
    value: { title, description, location, startAt, endAt: endAt || null, capacity, posterUrl: posterUrl || null },
    errors
  };
};

export const validateRsvpBody = (body) => {
  const errors = [];
  const response = trimText(body.response).toLowerCase();
  const guestsCount = parseInteger(body.guestsCount, 1);
  const notes = trimText(body.notes);

  if (!['yes', 'no', 'maybe'].includes(response)) errors.push('Response must be yes, no, or maybe.');
  if (!Number.isInteger(guestsCount) || guestsCount < 1 || guestsCount > 25) {
    errors.push('Guests count must be between 1 and 25.');
  }

  return {
    value: { response, guestsCount, notes: notes || null },
    errors
  };
};
