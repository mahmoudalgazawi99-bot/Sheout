export const PRESETS = {
  top: { label: 'علوي (قميص، فستان)', cols: ['الصدر', 'الخصر', 'الطول'] },
  bottom: { label: 'سفلي (بنطلون، تنورة)', cols: ['الخصر', 'الورك', 'الطول'] },
  shoes: { label: 'حذاء', cols: ['طول القدم'] },
  kids: { label: 'أطفال', cols: ['الطول', 'الصدر'] },
};

const s = (v, n) => String(v === null || v === undefined ? '' : v).trim().slice(0, n);

export function cleanGuide(input) {
  if (!input || typeof input !== 'object') return null;
  const unit = input.unit === 'in' ? 'in' : 'cm';
  const cols = (Array.isArray(input.cols) ? input.cols : []).map((c) => s(c, 20)).slice(0, 4);
  if (cols.length === 0 || cols.some((c) => !c)) return null;

  const rows = (Array.isArray(input.rows) ? input.rows : [])
    .slice(0, 14)
    .map((r) => ({
      size: s(r && r.size, 12),
      v: cols.map((_, i) => s(r && Array.isArray(r.v) ? r.v[i] : '', 14)),
    }))
    .filter((r) => r.size);

  if (rows.length === 0) return null;
  return { unit, cols, rows };
}
