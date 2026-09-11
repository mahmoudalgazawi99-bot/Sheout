import { supabase } from '@/lib/supabaseClient';

const categories = ['Women', 'Men', 'Kids', 'Shoes', 'Sports', 'Accessories'];

export default async function Home() {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*, stores(name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('*')
    .eq('status', 'active');

  return (
    <main style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '40px', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '20px 16px', borderBottom: '1px solid #eee' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, letterSpacing: '1px' }}>SHEOUT</h1>
        <input
          type="text"
          placeholder="Search products, stores..."
          style={{
            width: '100%',
            marginTop: '12px',
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            fontSize: '14px',
          }}
        />
      </header>

      {/* Debug info - سنحذفه بعد ما نحل المشكلة */}
      <div style={{ padding: '16px', background: '#ffe', fontSize: '11px', wordBreak: 'break-all' }}>
        <p><b>Products count:</b> {products ? products.length : 'null'}</p>
        <p><b>Products error:</b> {productsError ? JSON.stringify(productsError) : 'none'}</p>
        <p><b>Stores count:</b> {stores ? stores.length : 'null'}</p>
        <p><b>Stores error:</b> {storesError ? JSON.stringify(storesError) : 'none'}</p>
        <p><b>URL set:</b> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'yes' : 'NO - MISSING'}</p>
        <p><b>Key set:</b> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'yes' : 'NO - MISSING'}</p>
      </div>

      <section style={{ display: 'flex', gap: '10px', padding: '16px', overflowX: 'auto' }}>
        {categories.map((cat) => (
          <span key={cat} style={{ padding: '8px 16px', borderRadius: '20px', background: '#111', color: '#fff', fontSize: '13px', whiteSpace: 'nowrap' }}>
            {cat}
          </span>
        ))}
      </section>
    </main>
  );
}
