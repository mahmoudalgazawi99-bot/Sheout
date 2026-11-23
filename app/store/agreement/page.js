import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoreSession } from '@/lib/storeauth';
import { AGREEMENT_VERSION, agreementClauses } from '@/lib/agreement';
import { dateAr } from '@/lib/contact';
import AgreementAccept from '@/components/agreementaccept';
import { boxStyle } from '@/components/storeparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function StoreAgreementPage() {
  const account = await getStoreSession();
  if (!account) redirect('/store/login');

  let acceptedAt = null;
  try {
    const { data } = await supabaseAdmin
      .from('store_agreements')
      .select('accepted_at')
      .eq('store_id', account.store_id)
      .eq('version', AGREEMENT_VERSION)
      .maybeSingle();
    acceptedAt = data ? data.accepted_at : null;
  } catch {}

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      {acceptedAt && (
        <Link href="/store" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
          → الرئيسية
        </Link>
      )}
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0 4px' }}>اتفاقية المحل</h1>
      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>الإصدار {AGREEMENT_VERSION}</div>

      {acceptedAt ? (
        <div style={{ ...boxStyle, borderColor: '#177a3c', marginBottom: 14, color: '#177a3c', fontWeight: 600 }}>
          ✓ وافق المحل على هذا الإصدار بتاريخ {dateAr(acceptedAt)}
        </div>
      ) : (
        <div style={{ ...boxStyle, borderColor: theme.gold, marginBottom: 14, fontSize: 14, lineHeight: 1.8 }}>
          لازم توافق على الاتفاقية لتقدر تستقبل الطلبات.
        </div>
      )}

      {agreementClauses().map(([title, text]) => (
        <div key={title} style={{ ...boxStyle, marginBottom: 10 }}>
          <b>{title}</b>
          <div style={{ fontSize: 14, lineHeight: 1.9, marginTop: 6 }}>{text}</div>
        </div>
      ))}

      {!acceptedAt && <AgreementAccept />}
    </main>
  );
}
