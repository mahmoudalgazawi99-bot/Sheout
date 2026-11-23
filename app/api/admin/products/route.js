import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { cleanGuide } from '@/lib/sizeguide';

const MAX_IMAGES = 8;
const MAX_BYTES = 1.2 * 1024 * 1024;

const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });

const urlsOf = (images) =>
  (Array.isArray(images) ? images : [])
    .map((i) => (typeof i === 'string' ? i : i && i.url ? String(i.url) : null))
    .filter(Boolean);

export async function POST(request) {
  if (!(await isAdmin())) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح');
  }

  const action = String(body.action || '');
  const id = String(body.id || '');

  const { data: product } = await supabaseAdmin.from('products').select('id, images').eq('id', id).maybeSingle();
  if (!product) return fail('المنتج غير موجود', 404);

  if (action === 'add_image') {
    const current = urlsOf(product.images);
    if (current.length >= MAX_IMAGES) return fail(`الحد الأقصى ${MAX_IMAGES} صور`);

    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image || ''));
    if (!m) return fail('صيغة الصورة غير مدعومة');
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > MAX_BYTES) return fail('الصورة كبيرة، جرّب صورة أصغر');

    const ext = m[1] === 'image/png' ? 'png' : m[1] === 'image/webp' ? 'webp' : 'jpg';
    const path = `items/${id}/${Date.now()}.${ext}`;
    const { error: upError } = await supabaseAdmin.storage.from('products').upload(path, buf, {
      contentType: m[1],
      upsert: false,
    });
    if (upError) return fail('تعذّر رفع الصورة', 500);

    const url = supabaseAdmin.storage.from('products').getPublicUrl(path).data.publicUrl;
    const images = [...current, url];
    const { error } = await supabaseAdmin.from('products').update({ images }).eq('id', id);
    if (error) return fail('تعذّر الحفظ', 500);
    return NextResponse.json({ ok: true, images });
  }

  if (action === 'set_images') {
    const list = Array.isArray(body.images) ? body.images.map((u) => String(u)) : [];
    if (list.length > MAX_IMAGES) return fail(`الحد الأقصى ${MAX_IMAGES} صور`);
    if (list.some((u) => !/^https:\/\//.test(u) || u.length > 600)) return fail('رابط صورة غير صالح');

    const { error } = await supabaseAdmin.from('products').update({ images: list }).eq('id', id);
    if (error) return fail('تعذّر الحفظ', 500);
    return NextResponse.json({ ok: true, images: list });
  }

  if (action === 'save_guide') {
    const guide = cleanGuide(body.size_guide);
    const info = String(body.model_info || '').trim().slice(0, 160) || null;
    const { error } = await supabaseAdmin.from('products').update({ size_guide: guide, model_info: info }).eq('id', id);
    if (error) return fail('تعذّر الحفظ. تأكد إنك نفّذت أمر القاعدة', 500);
    return NextResponse.json({ ok: true, saved: !!guide });
  }

  if (action === 'video_url') {
    const ext = ['mp4', 'mov', 'webm'].includes(body.ext) ? body.ext : 'mp4';
    const path = `videos/${id}/${Date.now()}.${ext}`;
    const { data, error } = await supabaseAdmin.storage.from('products').createSignedUploadUrl(path);
    if (error || !data) return fail('تعذّر تجهيز رفع الفيديو', 500);
    return NextResponse.json({ ok: true, path: data.path || path, token: data.token });
  }

  if (action === 'set_video') {
    const v = body.video_url ? String(body.video_url) : null;
    const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/videos/`;
    if (v && !v.startsWith(prefix)) return fail('رابط فيديو غير صالح');

    const { error } = await supabaseAdmin.from('products').update({ video_url: v }).eq('id', id);
    if (error) return fail('تعذّر الحفظ. تأكد إنك نفّذت أمر القاعدة', 500);
    return NextResponse.json({ ok: true });
  }

  return fail('إجراء غير معروف');
}
