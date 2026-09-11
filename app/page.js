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
      </header>

      <div style={{ padding: '16px', background: '#ffe', fontSize: '11px', wordBreak: 'break-all' }}>
        <p><b>RAW URL VALUE:</b> [{process.env.NEXT_PUBLIC_SUPABASE_URL}]</p>
        <p><b>URL length:</b> {process.env.NEXT_PUBLIC_SUPABASE_URL?.length}</p>
        <p><b>Products error:</b> {productsError ? JSON.stringify(productsError) : 'none'}</p>
      </div>
    </main>
  );
}
