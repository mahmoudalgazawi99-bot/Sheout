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

export function computeSpeed(orders, range, now = new Date()) {
  const sk = startKey(range, now);
  const all = { accept: [], prep: [], pickup: [] };
  const stores = {};

  (orders || []).forEach((o) => {
    const created = parse(o.created_at);
    if (!created) return;
    if (sk && dayKey(created) < sk) return;

    (o.sub_orders || []).forEach((so) => {
      if (so.status === 'cancelled') return;

      const sid = so.store_id;
      if (!stores[sid]) {
        stores[sid] = { name: (so.stores && so.stores.name) || '—', accept: [], prep: [] };
      }

      const confirmed = parse(so.confirmed_at);
      const ready = parse(so.ready_at);
      const delivered = parse(so.delivered_at);

      const accept = minutes(created, confirmed);
      const prep = minutes(confirmed, ready);
      const pickup = minutes(ready, delivered);

      if (accept !== null) {
        all.accept.push(accept);
        stores[sid].accept.push(accept);
      }
      if (prep !== null) {
        all.prep.push(prep);
        stores[sid].prep.push(prep);
      }
      if (pickup !== null) all.pickup.push(pickup);
    });
  });

  return {
    overall: {
      accept: avg(all.accept),
      prep: avg(all.prep),
      pickup: avg(all.pickup),
      samples: all.accept.length,
    },
    stores: Object.values(stores)
      .map((s) => ({ name: s.name, accept: avg(s.accept), prep: avg(s.prep), samples: s.accept.length }))
      .filter((s) => s.accept !== null || s.prep !== null)
      .sort((a, b) => (a.accept ?? Infinity) - (b.accept ?? Infinity)),
  };
}
