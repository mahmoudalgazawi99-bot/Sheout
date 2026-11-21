import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoreSession } from '@/lib/storeauth';
import { Bubble } from '@/components/chatbubbles';
import { StoreComposer } from '@/components/chatparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function StoreChatPage() {
  const account = await getStoreSession();
  if (!account) redirect('/store/login');

  let messages = [];
  let loadError = false;
  try {
    const { data, error } = await supabaseAdmin
      .from('store_messages')
      .select('id, sender, sender_name, topic, kind, body, payload, images, status, created_at')
      .eq('store_id', account.store_id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) loadError = true;
    else messages = (data ?? []).reverse();
    await supabaseAdmin
      .from('store_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('store_id', account.store_id)
      .eq('sender', 'admin')
      .is('read_at', null);
  } catch {
    loadError = true;
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link href="/store" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>المحادثة مع الإدارة</h1>
      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>
        بلّغ عن منتج جديد، أو اسأل عن كمية أو سعر أو مستحقات.
      </div>

      {loadError && <p style={{ color: '#b00' }}>تعذّر تحميل المحادثة.</p>}
      {!loadError && messages.length === 0 && <p style={{ color: theme.muted }}>ما في رسائل لسا. ابدأ المحادثة.</p>}

      {messages.map((m) => (
        <Bubble key={m.id} m={m} viewer="store" />
      ))}

      <div style={{ marginTop: 16 }}>
        <StoreComposer />
      </div>
    </main>
  );
}
