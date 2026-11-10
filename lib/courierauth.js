import crypto from 'crypto';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const COURIER_COOKIE = 'sheout_courier';
export const COURIER_SESSION_SECONDS = 60 * 60 * 24 * 30;

function sessionKey() {
  const base = process.env.ADMIN_PASSWORD || '';
  return crypto.createHash('sha256').update('sheout-courier-session:' + base).digest();
}

export function makeCourierToken(accountId) {
  const payload = Buffer.from(
    JSON.stringify({ a: accountId, e: Date.now() + COURIER_SESSION_SECONDS * 1000 })
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

export async function getCourierSession() {
  const jar = await cookies();
  const data = readToken(jar.get(COURIER_COOKIE)?.value);
  if (!data) return null;

  const { data: account } = await supabaseAdmin
    .from('courier_accounts')
    .select('id, name, username, is_active')
    .eq('id', data.a)
    .maybeSingle();

  if (!account || !account.is_active) return null;
  return account;
}
