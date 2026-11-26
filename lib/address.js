export const GOVERNORATES = [
  ['عمّان', 'Amman'],
  ['إربد', 'Irbid'],
  ['الزرقاء', 'Zarqa'],
  ['البلقاء', 'Balqa'],
  ['مأدبا', 'Madaba'],
  ['الكرك', 'Karak'],
  ['الطفيلة', 'Tafilah'],
  ['معان', "Ma'an"],
  ['العقبة', 'Aqaba'],
  ['جرش', 'Jerash'],
  ['عجلون', 'Ajloun'],
  ['المفرق', 'Mafraq'],
];

// المحافظات اللي بتوصلها. للتجربة غالباً عمّان بس: خليها ['عمّان'] أو ['عمّان', 'الزرقاء']
export const SERVED = GOVERNORATES.map((g) => g[0]);

const HOSTS = [
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
  'g.co',
  'maps.apple.com',
];

export function cleanMapUrl(v) {
  const m = /https:\/\/[^\s]+/i.exec(String(v || ''));
  if (!m) return null;
  const s = m[0].replace(/[.,;)]+$/, '').slice(0, 300);
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:') return null;
    if (!HOSTS.includes(u.hostname.toLowerCase())) return null;
    return s;
  } catch {
    return null;
  }
}

export function composeAddress({ governorate, area, street, landmark }) {
  const parts = [governorate, area, street];
  if (landmark) parts.push(`قرب ${landmark}`);
  return parts
    .map((p) => String(p || '').trim())
    .filter(Boolean)
    .join('، ')
    .slice(0, 300);
}
