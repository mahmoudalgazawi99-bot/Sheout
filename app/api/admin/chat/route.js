import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { sendToAccounts } from '@/lib/push';
import { uploadImages } from '@/lib/chatimages';
import { cleanGuide } from '@/lib/sizeguide';
import { comboList, splitQuantity } from '@/lib/variants';

const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });

async function notifyStore(storeId, text) {
  try {
    const { data } = await supabaseAdmin.from('store_accounts').select('id').eq('store_id', storeId).eq('is_active', true);
    const ids = (data ?? []).map((a) => a.id);
    await sendToAccounts(ids, { title: 'رسالة من الإدارة', body: String(text).slice(0, 100), url: '/store/chat' });
  } catch {}
}

export async function POST(request) {
  if (!(await isAdmin())) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح');
  }

  const action = String(body.action || '');

  if (action === 'reply') {
    const storeId = String(body.storeId || '');
    const text = String(body.body || '').trim().slice(0, 1000);
    const hasImages = Array.isArray(body.images) && body.images.length > 0;
    if (text.length < 1 && !hasImages) return fail('اكتب رسالتك');

    const { data: store } = await supabaseAdmin.from('stores').select('id').eq('id', storeId).maybeSingle();
    if (!store) return fail('المحل غير موجود', 404);

    let images = [];
    try {
      images = await uploadImages(`admin-${storeId}`, body.images, 3);
    } catch (e) {
      return fail(e.message || 'تعذّر رفع الصورة');
    }

    const { error } = await supabaseAdmin.from('store_messages').insert({
      store_id: storeId,
      sender: 'admin',
      sender_name: 'الإدارة',
      topic: 'reply',
      kind: 'text',
      body: text || null,
      images,
    });
    if (error) return fail('تعذّر الإرسال', 500);

    await notifyStore(storeId, text || 'صورة جديدة');
    return NextResponse.json({ ok: true });
  }

  if (action === 'reject') {
    const reason = String(body.reason || '').trim().slice(0, 300);
    if (reason.length < 3) return fail('اكتب سبب الرفض');

    const { data: msg } = await supabaseAdmin
      .from('store_messages')
      .select('id, store_id, kind, status, payload')
      .eq('id', String(body.messageId || ''))
      .maybeSingle();
    if (!msg || msg.kind !== 'product_request') return fail('الطلب غير موجود', 404);
    if (msg.status !== 'pending') return fail('تمت مراجعة هذا الطلب مسبقاً');

    await supabaseAdmin.from('store_messages').update({ status: 'rejected' }).eq('id', msg.id);
    const text = `تعذّر نشر «${(msg.payload && msg.payload.name_ar) || 'المنتج'}». السبب: ${reason}`;
    await supabaseAdmin.from('store_messages').insert({
      store_id: msg.store_id,
      sender: 'admin',
      sender_name: 'الإدارة',
      topic: 'reply',
      kind: 'text',
      body: text,
    });
    await notifyStore(msg.store_id, text);
    return NextResponse.json({ ok: true });
  }

  if (action === 'approve') {
    const { data: msg } = await supabaseAdmin
      .from('store_messages')
      .select('id, store_id, kind, status, payload, images')
      .eq('id', String(body.messageId || ''))
      .maybeSingle();
    if (!msg || msg.kind !== 'product_request') return fail('الطلب غير موجود', 404);
    if (msg.status !== 'pending') return fail('تمت مراجعة هذا الطلب مسبقاً');

    const p = msg.payload || {};
    const name_ar = String(body.name_ar || p.name_ar || '').trim().slice(0, 80);
    const name_en = String(body.name_en || '').trim().slice(0, 80);
    const price = Math.round(Number(body.price) * 100) / 100;
    const sale = body.sale_price ? Math.round(Number(body.sale_price) * 100) / 100 : null;
    const quantity = Math.floor(Number(body.quantity));

    if (name_ar.length < 2) return fail('اكتب اسم المنتج بالعربي');
    if (!Number.isFinite(price) || price <= 0) return fail('السعر غير صحيح');
    if (sale !== null && (!Number.isFinite(sale) || sale <= 0 || sale >= price)) return fail('السعر بعد التخفيض غير صحيح');
    if (!Number.isInteger(quantity) || quantity < 0) return fail('الكمية غير صحيحة');

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        store_id: msg.store_id,
        name: name_en || name_ar,
        name_ar,
        description: p.description || '',
        category: p.category,
        price,
        sale_price: sale,
        sizes: p.sizes || [],
        colors: p.colors || [],
        quantity,
        images: msg.images || [],
        size_guide: cleanGuide(p.size_guide),
        model_info: p.model_info ? String(p.model_info).slice(0, 160) : null,
        status: 'active',
      })
      .select('id, product_no')
      .single();

    if (error || !product) return fail('تعذّر إنشاء المنتج، تأكد من البيانات ومن أوامر القاعدة السابقة', 500);

    try {
      const combos = comboList(p.sizes, p.colors);
      const parts = splitQuantity(quantity, combos.length);
      await supabaseAdmin
        .from('product_variants')
        .insert(combos.map((c, i) => ({ product_id: product.id, size: c.size, color: c.color, quantity: parts[i] })));
    } catch {}

    await supabaseAdmin
      .from('store_messages')
      .update({ status: 'approved', product_id: product.id, payload: { ...p, product_no: product.product_no } })
      .eq('id', msg.id);

    const text = `تم نشر «${name_ar}» بالموقع، رقم المنتج ${product.product_no}.`;
    await supabaseAdmin.from('store_messages').insert({
      store_id: msg.store_id,
      sender: 'admin',
      sender_name: 'الإدارة',
      topic: 'reply',
      kind: 'text',
      body: text,
    });
    await notifyStore(msg.store_id, text);
    return NextResponse.json({ ok: true });
  }

  return fail('إجراء غير معروف');
}
