export const LOW_STOCK = 3;

export function summarizeStock(products) {
  const active = (products || []).filter((p) => p.status === 'active');
  const qty = (p) => Number(p.quantity) || 0;

  const out = active.filter((p) => qty(p) <= 0);
  const low = active
    .filter((p) => qty(p) > 0 && qty(p) <= LOW_STOCK)
    .sort((a, b) => qty(a) - qty(b));
  const never = active.filter((p) => {
    const c = p.order_items && p.order_items[0] ? Number(p.order_items[0].count) : 0;
    return c === 0;
  });

  return { out, low, never };
}
