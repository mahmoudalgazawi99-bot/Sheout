export const DELIVERY_FEE = 3;
export const FREE_DELIVERY_FROM = 25;

export function deliveryFeeFor(subtotal) {
  return Number(subtotal) >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
}

export function amountToFree(subtotal) {
  const left = FREE_DELIVERY_FROM - Number(subtotal);
  return left > 0 ? Math.round(left * 100) / 100 : 0;
}
