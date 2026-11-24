export const toList = (v) =>
  Array.isArray(v)
    ? v.map((x) =>
        typeof x === 'string' ? x : x && (x.name || x.label || x.value) ? String(x.name || x.label || x.value) : String(x)
      )
    : [];

export function comboList(sizes, colors) {
  const s = toList(sizes).map((x) => x.slice(0, 30)).slice(0, 12);
  const c = toList(colors).map((x) => x.slice(0, 30)).slice(0, 12);
  const ss = s.length ? s : [''];
  const cc = c.length ? c : [''];
  const out = [];
  ss.forEach((size) => cc.forEach((color) => out.push({ size, color })));
  return out;
}

export function splitQuantity(total, n) {
  const t = Math.max(0, Math.floor(Number(total) || 0));
  if (n <= 0) return [];
  const base = Math.floor(t / n);
  let rem = t - base * n;
  return Array.from({ length: n }, () => {
    const q = base + (rem > 0 ? 1 : 0);
    if (rem > 0) rem -= 1;
    return q;
  });
}
