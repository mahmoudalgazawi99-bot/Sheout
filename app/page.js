import { supabase } from '@/lib/supabaseClient';

export default async function Home() {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*, stores(name)')
    .eq('status', 'active');

  return (
    <main style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>SHEOUT DEBUG</h1>
      <p><b>URL:</b> [{process.env.NEXT_PUBLIC_SUPABASE_URL}]</p>
      <p><b>URL length:</b> {process.env.NEXT_PUBLIC_SUPABASE_URL?.length}</p>
      <p><b>Products error:</b> {productsError ? JSON.stringify(productsError) : 'none'}</p>
      <p><b>Products count:</b> {products ? products.length : 'null'}</p>
    </main>
  );
}
