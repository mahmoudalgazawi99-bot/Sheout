import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendToAccounts, sendToAdmins } from '@/lib/push';
import { clientKey, isLimited } from '@/lib/ratelimit';
import { normPhone } from '@/lib/analytics';

const DELIVERY_FEE = 3;

const r2 = (n) => Math.round(n * 100) / 100;
const bad = (message, status = 400) => NextResponse.json({ error: message }, { status });

async function notifyStores(groups) {
  try {
    const storeIds = Object.keys(groups);
    const { data: accounts } = await supabaseAdmin
      .from('store_accounts')
      .select('id, store_id')
      .in('store_id', storeIds)
      .eq('is_active', true);

    const byStore = {};
    (accounts ?? []).forEach((a) => {
      if (!byStore[a.store_id]) byStore[a.store_id] = [];
      byStore[a.store_id].push(a.id);
    });

    await Promise.all(
      storeIds.map((sid) => {
        const ids = byStore[sid];
        if (!ids || ids.length === 0) return null;
        const pieces = groups[sid].items.reduce((s, l) => s + l.qty, 0);
        return sendToAccounts(ids, {
          title: 'طلب جديد',
          body: `وصلك طلب جديد (${pieces} ${pieces === 1 ? 'قطعة' : 'قطع'}) بانتظار القبول`,
          url: '/store',
        });
      })
    );
  } catch {}
}

async function notifyAdmins(orderId, groups, total) {
  try {
    const storeIds = Object.keys(groups);
    const pieces = storeIds.reduce(
      (sum, sid) => sum + groups[sid].items.reduce((a, l) => a + l.qty, 0),
      0
    );
    const shortId = String(orderId).slice(0, 8).toUpperCase();
    await sendToAdmins({
      title: 'طلب جديد على Sheout',
      body: `#${shortId} · ${pieces} قطعة من ${storeIds.length} ${storeIds.length === 1 ? 'محل' : 'محلات'} · ${total.toFixed(2)} د.أ`,
      url: `/admin/orders/${orderId}`,
    });
  } catch {}
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return bad('Invalid request');
  }

  const name = String(body.name || '').trim().slice(0, 100);
  const phone = String(body.phone || '').trim().slice(0, 30);
  const address = String(body.address || '').trim().slice(0, 300);
  const notes = String(body.notes || '').trim().slice(0, 500);
  const items = Array.isArray(body.items) ? body.items : [];

  if (!name || !phone || !address) return bad('Please fill in name, phone and address');
  if (items.length === 0 || items.length > 30) return bad('Your cart is empty');

  const lines = [];
  for (const i of items) {
    const qty = Number(i.qty);
    if (!i.productId || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return bad('Invalid cart item');
    }
    lines.push({
      productId: String(i.productId),
      size: i.size ? String(i.size).slice(0, 30) : null,
      color: i.color ? String(i.color).slice(0, 30) : null,
      qty,
    });
  }

  const limitMessage = 'Could not place your order: too many attempts. Please wait a few minutes.';
  if (await isLimited('order-ip:' + clientKey(request), 10, 600)) return bad(limitMessage, 429);
  const phoneDigits = normPhone(phone);
  if (phoneDigits && (await isLimited('order-phone:' + phoneDigits, 5, 3600))) {
    return bad(limitMessage, 429);
  }

  const ids = [...new Set(lines.map((l) => l.productId))];
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, store_id, name, price, sale_price, quantity, status')
    .in('id', ids);

  if (productsError || !products) return bad('Could not verify your cart', 400);

  const byId = new Map(products.map((p) => [p.id, p]));
  const qtyByProduct = {};

  for (const l of lines) {
    const p = byId.get(l.productId);
    if (!p || p.status !== 'active') {
      return bad('A product in your cart is no longer available');
    }
    qtyByProduct[l.productId] = (qtyByProduct[l.productId] || 0) + l.qty;
    if (qtyByProduct[l.productId] > Number(p.quantity)) {
      return bad(`Not enough stock for ${p.name}`);
    }
    l.price = Number(p.sale_price || p.price);
    l.storeId = p.store_id;
  }

  const groups = {};
  for (const l of lines) {
    if (!groups[l.storeId]) groups[l.storeId] = { items: [], subtotal: 0 };
    groups[l.storeId].items.push(l);
    groups[l.storeId].subtotal += l.price * l.qty;
  }

  const subtotal = r2(Object.values(groups).reduce((s, g) => s + g.subtotal, 0));
  const total = r2(subtotal + DELIVERY_FEE);

  let customerId = null;
  let orderId = null;

  async function rollback() {
    if (orderId) await supabaseAdmin.from('orders').delete().eq('id', orderId);
    if (customerId) await supabaseAdmin.from('customers').delete().eq('id', customerId);
  }

  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .insert({ name, phone })
    .select('id')
    .single();
  if (customerError || !customer) return bad('Could not place your order', 500);
  customerId = customer.id;

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_id: customerId,
      subtotal,
      delivery_fee: DELIVERY_FEE,
      total,
      address,
      notes: notes || null,
      payment_method: 'cod',
    })
    .select('id')
    .single();
  if (orderError || !order) {
    await rollback();
    return bad('Could not place your order', 500);
  }
  orderId = order.id;

  const storeIds = Object.keys(groups);
  const { data: subOrders, error: subError } = await supabaseAdmin
    .from('sub_orders')
    .insert(
      storeIds.map((sid) => ({
        order_id: orderId,
        store_id: sid,
        subtotal: r2(groups[sid].subtotal),
      }))
    )
    .select('id, store_id');
  if (subError || !subOrders) {
    await rollback();
    return bad('Could not place your order', 500);
  }

  const rows = [];
  for (const so of subOrders) {
    for (const l of groups[so.store_id].items) {
      rows.push({
        sub_order_id: so.id,
        product_id: l.productId,
        quantity: l.qty,
        price: l.price,
        size: l.size,
        color: l.color,
      });
    }
  }

  const { error: itemsError } = await supabaseAdmin.from('order_items').insert(rows);
  if (itemsError) {
    await rollback();
    return bad('Could not place your order', 500);
  }

  for (const pid of Object.keys(qtyByProduct)) {
    const p = byId.get(pid);
    await supabaseAdmin
      .from('products')
      .update({ quantity: Number(p.quantity) - qtyByProduct[pid] })
      .eq('id', pid);
  }

  await Promise.all([notifyStores(groups), notifyAdmins(orderId, groups, total)]);

  return NextResponse.json({ orderId });
}
