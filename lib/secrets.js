import crypto from 'crypto';

export function hasSessionSecret() {
  return !!(process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD);
}

export function sessionKey(purpose) {
  const base = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
  return crypto.createHmac('sha256', base).update('sheout-session:' + purpose).digest();
}
