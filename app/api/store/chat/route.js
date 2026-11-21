import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoreSession } from '@/lib/storeauth';
import { sendToAdmins } from '@/lib/push';
import { isLimited } from '@/lib/ratelimit';
import { uploadImages } from '@/lib/chatimages';

const TOPICS = ['stock', 'price', 'payout', 'order', 'other'];
const CATS = ['Women', 'Men', 'Kids', 'Shoes', 'Sports', 'Accessories'];
const TOPIC_AR = { stock: 'تحديث كمية', price: 'تعديل سعر', payout: 'مستحقات', order: 'استفسار عن طلب', other: 'رسالة' };

const fail = (message, status) => NextResponse.json({ error: message }, { status });

const list = (v) =>
  String(v || '')
    .split(/[,،]/)
    .map((x) => x.trim().slice(0, 20))
    .filter(Boolean)
    .slice(0, 12);

export async function POST(request) {
  const account = await getStoreSession();
  if (!account) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);

  if (await isLimited('store-msg:' + account.id, 40, 3600)) return fail('رسائل كثيرة، جرّب بعد شوي', 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح', 400);
  }

  const storeName = (account.stores && (account.stores.name_ar || account.stores.name)) || '';
  const kind = body.kind === 'product_request' ? 'product_request' : 'text';

  let row = {
    store_id: account.store_id,
    sender: 'store',
    sender_name: storeName,
    kind,
    topic: 'other',
    body: null,
    payload: null,
    status: null,
  };
  let pushText = '';

  if (kind === 'text') {
    const text = String(body.body || '').trim().slice(0, 1000);
    const topic = TOPICS.includes(body.topic) ? body.topic : 'other';
    if (text.length < 2 && !(Array.isArray(body.images) && body.images.length > 0)) return fail('اكتب رسالتك', 400);
    row = { ...row, topic, body: text || null };
    pushText = `${TOPIC_AR[topic]}: ${text.slice(0, 80)}`;
  } else {
    const p = body.payload || {};
    const name_ar = String(p.name_ar || '').trim().slice(0, 80);
    const name_en = String(p.name_en || '').trim().slice(0, 80);
    const price = Math.round(Number(p.price) * 100) / 100;
    const sale = p.sale_price ? Math.round(Number(p.sale_price) * 100) / 100 : null;
    const quantity = Math.floor(Number(p.quantity));

    if (name_ar.length < 2) return fail('اكتب اسم المنتج بالعربي', 400);
    if (!CATS.includes(p.category)) return fail('اختار القسم', 400);
    if (!Number.isFinite(price) || price <= 0 || price > 10000) return fail('اكتب سعر صحيح', 400);
    if (sale !== null && (!Number.isFinite(sale) || sale <= 0 || sale >= price)) return fail('السعر بعد التخفيض لازم يكون أقل من السعر', 400);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 9999) return fail('اكتب كمية صحيحة', 400);

    row = {
      ...row,
      topic: 'product',
      status: 'pending',
      payload: {
        name_ar,
        name_en,
        category: p.category,
        price,
        sale_price: sale,
        quantity,
        sizes: list(p.sizes),
        colors: list(p.colors),
        description: String(p.description || '').trim().slice(0, 600),
      },
    };
    pushText = `طلب منتج جديد: ${name_ar}`;
  }

  let images = [];
  try {
    images = await uploadImages(`store-${account.store_id}`, body.images);
  } catch (e) {
    return fail(e.message || 'تعذّر رفع الصورة', 400);
  }

  const { error } = await supabaseAdmin.from('store_messages').insert({ ...row, images });
  if (error) return fail('تعذّر إرسال الرسالة، حاول مرة أخرى', 500);

  try {
    await sendToAdmins({
      title: `رسالة من ${storeName}`,
      body: pushText,
      url: `/admin/chats?store=${account.store_id}`,
    });
  } catch {}

  return NextResponse.json({ ok: true });
}
