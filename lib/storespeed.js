import { toDate, dayKey } from '@/lib/analytics';

function startKey(range, now) {
  if (range === 'all') return '';
  const days = range === 'today' ? 1 : Number(range);
  return dayKey(new Date(now.getTime() - (days - 1) * 86400000));
}

const avg = (arr) =>
  arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

function minutes(a, b) {
  if (!a || !b) return null;
  const m = (b.getTime() - a.getTime()) / 60000;
  return m >= 0 ? m : null;
}

function parse(v) {
  return v ? toDate(v) : null;
}

export function computeStoreSpeed(subOrders, range, now = new Date()) {
  const sk = startKey(range, now);
  const accept = [];
  const prep = [];

  (subOrders || []).forEach((so) => {
    if (so.status === 'cancelled') return;
    const created = parse(so.created_at);
    if (!created) return;
    if (sk && dayKey(created) < sk) return;

    const confirmed = parse(so.confirmed_at);
    const ready = parse(so.ready_at);

    const a = minutes(created, confirmed);
    const p = minutes(confirmed, ready);
    if (a !== null) accept.push(a);
    if (p !== null) prep.push(p);
  });

  return { accept: avg(accept), prep: avg(prep) };
}
