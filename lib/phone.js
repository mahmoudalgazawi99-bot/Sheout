import { normPhone } from '@/lib/analytics';

export function normalizePhone(p) {
  let d = normPhone(p);
  if (d.startsWith('00962')) d = '0' + d.slice(5);
  else if (d.startsWith('962')) d = '0' + d.slice(3);
  return d;
}
