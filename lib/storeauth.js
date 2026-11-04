import crypto from 'crypto';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const STORE_COOKIE = 'sheout_store';
export const STORE_SESSION_SECONDS = 60 * 60 * 24 * 30;

function sessionKey() {
  const base = process.env.ADMIN_PASSWORD || '';
  return crypto.createHash('sha256').update('sheout-store-session:' + base).digest();
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, saltHex, hashHex] = String(stored).split('$');
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(String(password), Buffer.from(saltHex, 'hex'), expected.length);
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

const DUMMY_HASH = hashPassword('sheout-dummy-password');

export function dummyVerify(password) {
  verifyPassword(password, DUMMY_HASH);
}

export function makeSessionToken(accountId) {
  const payload = Buffer.from(
    JSON.stringify({ a: accountId, e: Date.now() + STORE_SESSION_SECONDS * 1000 })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', sessionKey()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function readToken(token) {
  if (!process.env.ADMIN_PASSWORD) return null;
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', sessionKey()).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.a || !data.e || data.e < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getStoreSession() {
  const jar = await cookies();
  const data = readToken(jar.get(STORE_COOKIE)?.value);
  if (!data) return null;

  const { data: account } = await supabaseAdmin
    .from('store_accounts')
    .select('id, username, is_active, store_id, stores(id, name, name_ar)')
    .eq('id', data.a)
    .maybeSingle();

  if (!account || !account.is_active) return null;
  return account;
}
