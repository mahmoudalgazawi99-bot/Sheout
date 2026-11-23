import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchAll } from '@/lib/dbpage';
import { ACCEPT_MINUTES, PREP_MINUTES, AGREEMENT_VERSION } from '@/lib/agreement';

export const MIN_PARCELS = 5;
export const WEIGHTS = { accept: 30, prep: 25, issues: 20, rating: 15, complaints: 10 };

const mins = (a, b) => (new Date(b).getTime() - new Date(a).getTime()) / 60000;
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export async function loadScorecards(days) {
  const since = days ? new Date(Date.now() - days * 86400000).toISOString() : null;

  const build = (table, cols, extra) => () => {
    let q = supabaseAdmin.from(table).select(cols);
    if (since) q = q.gte('created_at', since);
    if (extra) q = extra(q);
    return q.order('id', { ascending: true });
  };

  const [subs, issues, complaints, reviews, storesRes, agrRes] = await Promise.all([
    fetchAll(build('sub_orders', 'id, store_id, status, created_at, confirmed_at, ready_at')),
    fetchAll(build('order_issues', 'id, store_id, created_at')),
    fetchAll(build('complaints', 'id, created_at, products(store_id)', (q) => q.not('product_id', 'is', null))),
    fetchAll(() => supabaseAdmin.from('product_reviews').select('id, rating, products(store_id)').order('id', { ascending: true })),
    supabaseAdmin.from('stores').select('id, name, name_ar'),
    supabaseAdmin.from('store_agreements').select('store_id, accepted_at').eq('version', AGREEMENT_VERSION),
  ]);

  const agreed = {};
  (agrRes.data ?? []).forEach((a) => {
    agreed[a.store_id] = a.accepted_at;
  });

  const by = {};
  const get = (id) => {
    if (!by[id]) by[id] = { parcels: 0, cancelled: 0, delivered: 0, accept: [], prep: [], issues: 0, complaints: 0, ratings: [] };
    return by[id];
  };

  subs.forEach((s) => {
    const e = get(s.store_id);
    if (s.status === 'cancelled') {
      e.cancelled += 1;
      return;
    }
    e.parcels += 1;
    if (s.status === 'delivered') e.delivered += 1;
    if (s.confirmed_at) e.accept.push(mins(s.created_at, s.confirmed_at));
    if (s.confirmed_at && s.ready_at) e.prep.push(mins(s.confirmed_at, s.ready_at));
  });
  issues.forEach((i) => {
    get(i.store_id).issues += 1;
  });
  complaints.forEach((c) => {
    if (c.products && c.products.store_id) get(c.products.store_id).complaints += 1;
  });
  reviews.forEach((r) => {
    if (r.products && r.products.store_id) get(r.products.store_id).ratings.push(Number(r.rating) || 0);
  });

  const rows = (storesRes.data ?? []).map((s) => {
    const e = by[s.id] || get(s.id);
    const acceptRate = e.accept.length ? e.accept.filter((m) => m <= ACCEPT_MINUTES).length / e.accept.length : null;
    const prepRate = e.prep.length ? e.prep.filter((m) => m <= PREP_MINUTES).length / e.prep.length : null;
    const issueRate = e.issues / Math.max(1, e.parcels);
    const complaintRate = e.delivered > 0 ? e.complaints / e.delivered : null;
    const rating = mean(e.ratings);

    const comps = [];
    if (acceptRate !== null) comps.push([WEIGHTS.accept, acceptRate]);
    if (prepRate !== null) comps.push([WEIGHTS.prep, prepRate]);
    comps.push([WEIGHTS.issues, clamp01(1 - issueRate * 5)]);
    if (rating !== null) comps.push([WEIGHTS.rating, rating / 5]);
    if (complaintRate !== null) comps.push([WEIGHTS.complaints, clamp01(1 - complaintRate * 5)]);
    const wsum = comps.reduce((sum, c) => sum + c[0], 0);
    const score =
      e.parcels >= MIN_PARCELS && wsum > 0
        ? Math.round((comps.reduce((sum, c) => sum + c[0] * c[1], 0) / wsum) * 100)
        : null;

    return {
      id: s.id,
      name: s.name_ar || s.name,
      parcels: e.parcels,
      cancelled: e.cancelled,
      acceptMins: mean(e.accept),
      acceptRate,
      prepMins: mean(e.prep),
      prepRate,
      issues: e.issues,
      issueRate,
      complaints: e.complaints,
      complaintRate,
      rating,
      ratingCount: e.ratings.length,
      score,
      rank: null,
      agreedAt: agreed[s.id] || null,
    };
  });

  rows.sort((a, b) => (b.score === null ? -1 : b.score) - (a.score === null ? -1 : a.score));
  let rank = 0;
  rows.forEach((r) => {
    if (r.score !== null) {
      rank += 1;
      r.rank = rank;
    }
  });

  const scored = rows.filter((r) => r.score !== null);
  const avgOf = (k) => mean(scored.map((r) => r[k]).filter((v) => v !== null && v !== undefined));
  const avg = scored.length
    ? {
        acceptMins: avgOf('acceptMins'),
        acceptRate: avgOf('acceptRate'),
        prepMins: avgOf('prepMins'),
        prepRate: avgOf('prepRate'),
        issueRate: avgOf('issueRate'),
        rating: avgOf('rating'),
        score: avgOf('score'),
      }
    : null;

  return { rows, avg, scoredCount: scored.length };
}
