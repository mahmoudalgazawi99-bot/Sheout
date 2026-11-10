import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

let configured = false;

function configure() {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export function isPushConfigured() {
  return configure();
}

async function deliver(subs, table, payload) {
  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;

  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          { TTL: 60 * 60 * 12, urgency: 'high' }
        );
        sent += 1;
      } catch (err) {
        failed += 1;
        if (err && (err.statusCode === 404 || err.statusCode === 410)) {
          await supabaseAdmin.from(table).delete().eq('id', s.id);
        }
      }
    })
  );

  return { sent, failed };
}

export async function sendToAccounts(accountIds, payload) {
  if (!accountIds || accountIds.length === 0 || !configure()) return { sent: 0, failed: 0 };

  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('account_id', accountIds);

  return deliver(subs, 'push_subscriptions', payload);
}

export async function sendToAdmins(payload) {
  if (!configure()) return { sent: 0, failed: 0 };

  const { data: subs } = await supabaseAdmin
    .from('admin_push_subscriptions')
    .select('id, endpoint, p256dh, auth');

  return deliver(subs, 'admin_push_subscriptions', payload);
}

export async function sendToCouriers(payload, accountId = null) {
  if (!configure()) return { sent: 0, failed: 0 };

  let query = supabaseAdmin
    .from('courier_push_subscriptions')
    .select('id, endpoint, p256dh, auth, account_id, courier_accounts(is_active)');
  if (accountId) query = query.eq('account_id', accountId);

  const { data } = await query;
  const subs = (data ?? []).filter((s) => s.courier_accounts && s.courier_accounts.is_active);

  return deliver(subs, 'courier_push_subscriptions', payload);
}
