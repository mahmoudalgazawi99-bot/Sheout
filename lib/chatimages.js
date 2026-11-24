import { supabaseAdmin } from '@/lib/supabaseAdmin';

const MAX_BYTES = 800 * 1024;

export async function uploadImages(prefix, dataUrls, max = 3) {
  const urls = [];
  const list = (Array.isArray(dataUrls) ? dataUrls : []).slice(0, max);

  for (let i = 0; i < list.length; i++) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(list[i]));
    if (!m) throw new Error('صيغة الصورة غير مدعومة');
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > MAX_BYTES) throw new Error('الصورة كبيرة، جرّب صورة أصغر');

    const ext = m[1] === 'image/png' ? 'png' : m[1] === 'image/webp' ? 'webp' : 'jpg';
    const path = `chat/${prefix}/${Date.now()}-${i}.${ext}`;
    const { error } = await supabaseAdmin.storage.from('products').upload(path, buf, {
      contentType: m[1],
      upsert: false,
    });
    if (error) throw new Error('تعذّر رفع الصورة، جرّب بدون صورة');

    urls.push(supabaseAdmin.storage.from('products').getPublicUrl(path).data.publicUrl);
  }

  return urls;
}
