import { cookies } from 'next/headers';
import crypto from 'crypto';

export const COOKIE_NAME = 'sheout_admin';

export function makeToken() {
  const secret = process.env.ADMIN_PASSWORD || '';
  return crypto.createHmac('sha256', secret).update('sheout-admin-session').digest('hex');
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return safeEqual(token, makeToken());
}
