import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { ago } from '@/lib/contact';
import { Bubble } from '@/components/chatbubbles';
import { AdminComposer, ProductDecision } from '@/components/chatparts';

export const dynamic = 'force-dynamic';

export default async function AdminChatsPage({ searchParams }) {
  if (!(await isAdmin())) redirect('/admin/login');

  const sp = await searchParams;
  const storeId = String((Array.isArray(sp?.store) ? sp.store[0] : sp?.store) || '');
  const wrap = { maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' };

  if (storeId) {
    const { data: store } = await supabaseAdmin.from('stores').select('id, name, name_ar').eq('id', storeId).maybeSingle();

    if (!store) {
      return (
        <main dir="rtl" lang="ar" style={wrap}>
          <Link href="/admin/chats" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
            → المحادثات
          </Link>
          <h2>المحل غير موجود</h2>
        </main>
      );
    }

    let messages = [];
    let loadError = false;
    try {
      const { data, error } = await supabaseAdmin
        .from('store_messages')
        .select('id, sender, sender_name, topic, kind, body, payload, images, status, created_at')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) loadError = true;
      else messages = (data ?? []).reverse();
      await supabaseAdmin
        .from('store_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('store_id', storeId)
        .eq('sender', 'store')
        .is('read_at', null);
    } catch {
      loadError = true;
    }

    return (
      <main dir="rtl" lang="ar" style={wrap}>
        <Link href="/admin/chats" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
          → المحادثات
        </Link>
        <h1 style={{ marginBottom: 12 }}>{store.name_ar || store.name}</h1>

        {loadError && <p style={{ color: '#b00' }}>تعذّر التحميل. تأكد إنو جدول store_messages موجود بالقاعدة.</p>}
        {!loadError && messages.length === 0 && <p style={{ color: '#777' }}>ما في رسائل لسا.</p>}

        {messages.map((m) => (
          <Bubble key={m.id} m={m} viewer="admin">
            {m.kind === 'product_request' && m.status === 'pending' ? (
              <ProductDecision messageId={m.id} payload={m.payload || {}} />
            ) : null}
          </Bubble>
        ))}

        <div style={{ marginTop: 16 }}>
          <AdminComposer storeId={storeId} />
        </div>
      </main>
    );
  }

  let msgs = [];
  let loadError = false;
  try {
    const { data, error } = await supabaseAdmin
      .from('store_messages')
      .select('store_id, sender, kind, status, body, payload, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(400);
    if (error) loadError = true;
    else msgs = data ?? [];
  } catch {
    loadError = true;
  }

  const { data: stores } = await supabaseAdmin.from('stores').select('id, name, name_ar');

  const info = {};
  msgs.forEach((m) => {
    if (!info[m.store_id]) info[m.store_id] = { last: m, unread: 0, pending: 0 };
    if (m.sender === 'store' && !m.read_at) info[m.store_id].unread += 1;
    if (m.kind === 'product_request' && m.status === 'pending') info[m.store_id].pending += 1;
  });

  const rows = (stores ?? [])
    .map((s) => ({ s, i: info[s.id] }))
    .sort((a, b) => {
      const ua = a.i ? a.i.unread + a.i.pending : 0;
      const ub = b.i ? b.i.unread + b.i.pending : 0;
      if (ua !== ub) return ub - ua;
      return (b.i ? new Date(b.i.last.created_at) : 0) - (a.i ? new Date(a.i.last.created_at) : 0);
    });

  const preview = (m) =>
    m.kind === 'product_request' ? `طلب منتج: ${(m.payload && m.payload.name_ar) || ''}` : String(m.body || 'صورة').slice(0, 70);

  return (
    <main dir="rtl" lang="ar" style={wrap}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1>محادثات المحلات</h1>

      {loadError && <p style={{ color: '#b00' }}>تعذّر التحميل. تأكد إنو جدول store_messages موجود بالقاعدة.</p>}

      {rows.map(({ s, i }) => (
        <Link
          key={s.id}
          href={`/admin/chats?store=${s.id}`}
          style={{
            display: 'block',
            textDecoration: 'none',
            color: 'inherit',
            border: `1px solid ${i && (i.unread > 0 || i.pending > 0) ? '#e2b0b0' : '#eee'}`,
            borderRadius: 12,
            padding: 12,
            marginBottom: 10,
            background: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <b>{s.name_ar || s.name}</b>
            <span style={{ display: 'flex', gap: 6 }}>
              {i && i.pending > 0 ? (
                <span style={{ background: '#b86a00', color: '#fff', borderRadius: 999, padding: '1px 9px', fontSize: 12 }}>
                  {i.pending} منتج
                </span>
              ) : null}
              {i && i.unread > 0 ? (
                <span style={{ background: '#b00', color: '#fff', borderRadius: 999, padding: '1px 9px', fontSize: 12 }}>
                  {i.unread}
                </span>
              ) : null}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#777', marginTop: 4 }}>
            {i ? `${i.last.sender === 'admin' ? 'أنت: ' : ''}${preview(i.last)} · ${ago(i.last.created_at)}` : 'ما في رسائل'}
          </div>
        </Link>
      ))}
    </main>
  );
}
