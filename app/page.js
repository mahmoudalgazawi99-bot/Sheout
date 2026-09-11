import { supabase } from '@/lib/supabaseClient';

const categories = ['Women', 'Men', 'Kids', 'Shoes', 'Sports', 'Accessories'];

export default async function Home() {
  const { data: products } = await supabase
    .from('products')
    .select('*, stores(name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const { data: stores } = await supabase
    .from('stores')
    .select('*')
    .eq('status', 'active');

  return (
    <main style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '40px', fontFamily: 'sans-serif' }}>
      {/* Header */}
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

      {/* Categories */}
      <section style={{ display: 'flex', gap: '10px', padding: '16px', overflowX: 'auto' }}>
        {categories.map((cat) => (
          <span
            key={cat}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              background: '#111',
              color: '#fff',
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </span>
        ))}
      </section>

      {/* Featured Stores */}
      <section style={{ padding: '0 16px 16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>Featured Stores</h2>
        <div style={{ display: 'flex', gap: '14px', overflowX: 'auto' }}>
          {stores?.map((store) => (
            <div key={store.id} style={{ textAlign: 'center', minWidth: '70px' }}>
              <img
                src={store.logo_url}
                alt={store.name}
                style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <p style={{ fontSize: '11px', marginTop: '4px' }}>{store.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products Grid */}
      <section style={{ padding: '0 16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>New Arrivals</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {products?.map((product) => (
            <div key={product.id} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
              <img
                src={product.images?.[0]}
                alt={product.name}
                style={{ width: '100%', height: '160px', objectFit: 'cover' }}
              />
              <div style={{ padding: '10px' }}>
                <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>{product.stores?.name}</p>
                <p style={{ fontSize: '13px', fontWeight: 600, margin: '4px 0' }}>{product.name}</p>
                <p style={{ fontSize: '13px', margin: 0 }}>
                  {product.sale_price ? (
                    <>
                      <span style={{ color: '#c00', fontWeight: 700 }}>{product.sale_price} JOD</span>{' '}
                      <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '11px' }}>
                        {product.price} JOD
                      </span>
                    </>
                  ) : (
                    <span style={{ fontWeight: 700 }}>{product.price} JOD</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
