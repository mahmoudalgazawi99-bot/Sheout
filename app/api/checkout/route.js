import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendToAccounts, sendToAdmins } from '@/lib/push';
import { clientKey, isLimited } from '@/lib/ratelimit';
import { dayKey } from '@/lib/analytics';
import { normalizePhone } from '@/lib/phone';
import { deliveryFeeFor } from '@/lib/shipping';
import { SERVED, cleanMapUrl, composeAddress } from '@/lib/address';

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

async function notifyAdmins(orderId, orderNo, groups, total) {
  try {
    const storeIds = Object.keys(groups);
    const pieces = storeIds.reduce(
      (sum, sid) => sum + groups[sid].items.reduce((a, l) => a + l.qty, 0),
      0
    );
    await sendToAdmins({
      title: 'طلب جديد على Sheout',
      body: `#${orderNo} · ${pieces} قطعة من ${storeIds.length} ${storeIds.length === 1 ? 'محل' : 'محلات'} · ${total.toFixed(2)} د.أ`,
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
  const governorate = String(body.governorate || '').trim().slice(0, 30);
  const area = String(body.area || '').trim().slice(0, 80);
  const street = String(body.street || '').trim().slice(0, 160);
  const landmark = String(body.landmark || '').trim().slice(0, 100);
  const mapUrl = cleanMapUrl(body.mapUrl);
  const notes = String(body.notes || '').trim().slice(0, 500);
  const items = Array.isArray(body.items) ? body.items : [];

  const structured = !!(governorate && area && street);
  let address = String(body.address || '').trim().slice(0, 300);
  if (structured) {
    if (!SERVED.includes(governorate)) return bad('Delivery is not available in this governorate yet');
    address = composeAddress({ governorate, area, street, landmark });
  }

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

  const phoneNorm = normalizePhone(phone);
  const limitMessage = 'Could not place your order: too many attempts. Please wait a few minutes.';
  if (await isLimited('order-ip:' + clientKey(request), 10, 600)) return bad(limitMessage, 429);
  if (phoneNorm && (await isLimited('order-phone:' + phoneNorm, 5, 3600))) {
    return bad(limitMessage, 429);
  }

  const ids = [...new Set(lines.map((l) => l.productId))];
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, store_id, name, price, sale_price, quantity, status')
    .in('id', ids);

  if (productsError || !products) return bad('Could not verify your cart', 400);

  const { data: variantRows } = await supabaseAdmin
    .from('product_variants')
    .select('product_id, size, color, quantity')
    .in('product_id', ids);

  const variantsByProduct = {};
  (variantRows ?? []).forEach((v) => {
    if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
    variantsByProduct[v.product_id].push(v);
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const qtyByProduct = {};
  const qtyByVariant = {};

  for (const l of lines) {
    const p = byId.get(l.productId);
    if (!p || p.status !== 'active') {
      return bad('A product in your cart is no longer available');
    }

    const vlist = variantsByProduct[l.productId];
    if (vlist && vlist.length > 0) {
      const size = l.size || '';
      const color = l.color || '';
      const v = vlist.find((x) => (x.size || '') === size && (x.color || '') === color);
      if (!v) return bad('A product in your cart is no longer available');

      const k = `${l.productId}|${size}|${color}`;
      if (!qtyByVariant[k]) {
        qtyByVariant[k] = { product_id: l.productId, size, color, qty: 0, have: Number(v.quantity) || 0 };
      }
      qtyByVariant[k].qty += l.qty;
      if (qtyByVariant[k].qty > qtyByVariant[k].have) return bad(`Not enough stock for ${p.name}`);
    } else {
      qtyByProduct[l.productId] = (qtyByProduct[l.productId] || 0) + l.qty;
      if (qtyByProduct[l.productId] > Number(p.quantity)) return bad(`Not enough stock for ${p.name}`);
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
  const deliveryFee = deliveryFeeFor(subtotal);
  const total = r2(subtotal + deliveryFee);

  let customerId = null;
  let createdCustomer = false;
  let orderId = null;
  let reserved = null;

  async function rollback() {
    if (orderId) await supabaseAdmin.from('orders').delete().eq('id', orderId);
    if (createdCustomer && customerId) await supabaseAdmin.from('customers').delete().eq('id', customerId);
    if (reserved) {
      await supabaseAdmin.rpc('release_stock', { p_items: reserved });
      reserved = null;
    }
  }

  const failOrder = async (message, status = 500) => {
    await rollback();
    return bad(message, status);
  };

  const reserveItems = Object.values(qtyByVariant).map((v) => ({
    product_id: v.product_id,
    size: v.size,
    color: v.color,
    qty: v.qty,
  }));

  if (reserveItems.length > 0) {
    const { error: reserveError } = await supabaseAdmin.rpc('reserve_stock', { p_items: reserveItems });
    if (reserveError) {
      const m = /OUT_OF_STOCK:([0-9a-f-]+)/i.exec(String(reserveError.message || ''));
      if (m) {
        const p = byId.get(m[1]);
        return bad(`Not enough stock for ${p ? p.name : 'a product'}`);
      }
      return bad('Could not place your order', 500);
    }
    reserved = reserveItems;
  }

  try {
    let customer = null;
    if (phoneNorm) {
      const { data: existing } = await supabaseAdmin
        .from('customers')
        .select('id, member_no')
        .eq('phone_norm', phoneNorm)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (existing) customer = existing;
    }

    if (!customer) {
      const { data: created, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({ name, phone, phone_norm: phoneNorm })
        .select('id, member_no')
        .single();
      if (customerError || !created) return await failOrder('Could not place your order');
      customer = created;
      createdCustomer = true;
    }
    customerId = customer.id;

    const prefix = `${dayKey(new Date()).replace(/-/g, '')}-${customer.member_no}-`;
    const { count: todayCount } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .like('order_no', `${prefix}%`);

    let extra = structured
      ? { governorate, area, landmark: landmark || null, map_url: mapUrl }
      : { map_url: mapUrl };

    let seq = (todayCount || 0) + 1;
    let order = null;
    for (let attempt = 0; attempt < 6 && !order; attempt++) {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .insert({
          customer_id: customerId,
          order_no: `${prefix}${seq}`,
          subtotal,
          delivery_fee: deliveryFee,
          total,
          address,
          notes: notes || null,
          payment_method: 'cod',
          ...extra,
        })
        .select('id, order_no')
        .single();

      if (!error && data) {
        order = data;
      } else if (error && error.code === '23505') {
        seq += 1;
      } else if (error && /column/i.test(String(error.message)) && Object.keys(extra).length > 0) {
        extra = {};
      } else {
        break;
      }
    }

    if (!order) return await failOrder('Could not place your order');
    orderId = order.id;

    const storeIds = Object.keys(groups);
    const { data: subOrders, error: subError } = await supabaseAdmin
      .from('sub_orders')
      .insert(
        storeIds.map((sid, idx) => ({
          order_id: orderId,
          store_id: sid,
          subtotal: r2(groups[sid].subtotal),
          part_no: idx + 1,
          parts_total: storeIds.length,
        }))
      )
      .select('id, store_id');
    if (subError || !subOrders) return await failOrder('Could not place your order');

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
    if (itemsError) return await failOrder('Could not place your order');

    for (const pid of Object.keys(qtyByProduct)) {
      const p = byId.get(pid);
      await supabaseAdmin
        .from('products')
        .update({ quantity: Number(p.quantity) - qtyByProduct[pid] })
        .eq('id', pid);
    }

    await Promise.all([notifyStores(groups), notifyAdmins(orderId, order.order_no, groups, total)]);

    return NextResponse.json({ orderId, orderNo: order.order_no });
  } catch {
    return await failOrder('Could not place your order');
  }
}
