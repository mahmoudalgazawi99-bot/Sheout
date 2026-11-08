import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export function clientKey(request) {
  const fwd = request.headers.get('x-forwarded-for') || '';
  const ip = fwd.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
  return crypto.createHash('sha256').update(`${ip}:sheout`).digest('hex').slice(0, 24);
}

export async function isLimited(key, max, windowSeconds) {
  try {
    const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const { count, error } = await supabaseAdmin
      .from('rate_events')
      .select('id', { count: 'exact', head: true })
      .eq('key', key)
      .gte('created_at', since);

    if (error) return false;
    if ((count || 0) >= max) return true;

    await supabaseAdmin.from('rate_events').insert({ key });

    if (Math.random() < 0.05) {
      const old = new Date(Date.now() - 86400000).toISOString();
      await supabaseAdmin.from('rate_events').delete().lt('created_at', old);
    }
    return false;
  } catch {
    return false;
  }
}
