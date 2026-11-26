import { cookies } from 'next/headers';
import crypto from 'crypto';
import { sessionKey, hasSessionSecret } from '@/lib/secrets';

export const COOKIE_NAME = 'sheout_admin';
export const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 30;

export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

export function makeToken() {
  const payload = Buffer.from(
    JSON.stringify({
      r: 'admin',
      e: Date.now() + ADMIN_SESSION_SECONDS * 1000,
      n: crypto.randomBytes(8).toString('hex'),
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', sessionKey('admin')).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function readToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', sessionKey('admin')).update(payload).digest('base64url');
  if (!safeEqual(sig, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.r !== 'admin' || !data.e || data.e < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function isAdmin() {
  if (!hasSessionSecret()) return false;
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return !!readToken(token);
}
