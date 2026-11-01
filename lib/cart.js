const KEY = 'sheout_cart_v1';

export function getCart() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('cart-updated'));
  } catch {}
}

export function addToCart(item) {
  const items = getCart();
  const key = `${item.productId}|${item.size || ''}|${item.color || ''}`;
  const existing = items.find((i) => i.key === key);
  if (existing) {
    existing.qty = Math.min(existing.qty + item.qty, item.maxQty || 99);
  } else {
    items.push({ ...item, key });
  }
  save(items);
}

export function setQty(key, qty) {
  const items = getCart()
    .map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, i.maxQty || 99)) } : i));
  save(items);
}

export function removeItem(key) {
  save(getCart().filter((i) => i.key !== key));
}

export function clearCart() {
  save([]);
}
