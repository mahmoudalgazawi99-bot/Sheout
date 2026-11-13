import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoreSession } from '@/lib/storeauth';
import { summarizeStock, LOW_STOCK } from '@/lib/stock';
import { StockGroup, boxStyle } from '@/components/storeparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function StoreStockPage() {
  const account = await getStoreSession();
  if (!account) redirect('/store/login');

  const { data } = await supabaseAdmin
    .from('products')
    .select('id, name, name_ar, product_no, quantity, status, order_items(count)')
    .eq('store_id', account.store_id)
    .order('product_no', { ascending: true });

  const products = (data ?? []).filter((p) => p.status === 'active');
  const stock = summarizeStock(data ?? []);
  const hasAlerts = stock.out.length > 0 || stock.low.length > 0 || stock.never.length > 0;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link href="/store" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>المخزون</h1>

      {hasAlerts && (
        <div style={boxStyle}>
          <div style={{ fontWeight: 700 }}>تنبيهات</div>
          <StockGroup title="نفد المخزون" rows={stock.out} showQty color="#b00" />
          <StockGroup title={`مخزون منخفض (${LOW_STOCK} قطع أو أقل)`} rows={stock.low} showQty color="#b86a00" />
          <StockGroup title="منتجات ما انطلبت أبداً" rows={stock.never} showQty={false} />
        </div>
      )}

      <div style={{ ...boxStyle, marginTop: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>كل منتجاتك ({products.length})</div>
        {products.map((p, i) => {
          const q = Number(p.quantity) || 0;
          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${theme.line}`,
                fontSize: 14,
              }}
            >
              <span>
                {p.name_ar || p.name}
                {p.product_no ? <span style={{ color: theme.muted, fontSize: 12 }}> · رقم {p.product_no}</span> : null}
              </span>
              <b style={{ color: q <= 0 ? '#b00' : q <= LOW_STOCK ? '#b86a00' : theme.ink }}>{q} قطعة</b>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: theme.muted, marginTop: 10 }}>لتحديث الكميات تواصل مع إدارة المنصة.</div>
    </main>
  );
}
