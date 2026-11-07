export function Card({ label, value, sub }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, background: '#fff' }}>
      <div style={{ fontSize: 12, color: '#777' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 18, margin: '0 0 10px' }}>{title}</h2>
      <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, background: '#fff' }}>
        {children}
      </div>
    </section>
  );
}

export function BarList({ rows, format }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div>
      {rows.map((r) => (
        <div key={r.label} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, gap: 8 }}>
            <span>{r.label}</span>
            <b>{format(r.value)}</b>
          </div>
          <div style={{ height: 8, background: '#f1ece0', borderRadius: 4, marginTop: 4 }}>
            <div
              style={{
                width: `${(r.value / max) * 100}%`,
                height: '100%',
                background: '#b8924a',
                borderRadius: 4,
              }}
            />
          </div>
          {r.note && <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>{r.note}</div>}
        </div>
      ))}
    </div>
  );
}

export function ColumnChart({ items, format, labelEvery = 1 }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const width = items.length * 16;
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, minWidth: width }}>
        {items.map((it, idx) => (
          <div
            key={idx}
            title={`${it.label}: ${format(it.value)}`}
            style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          >
            <div
              style={{
                height: `${(it.value / max) * 100}%`,
                minHeight: it.value > 0 ? 2 : 0,
                background: '#b8924a',
                borderRadius: 3,
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, minWidth: width }}>
        {items.map((it, idx) => (
          <div key={idx} style={{ flex: 1, fontSize: 10, color: '#777', textAlign: 'center' }}>
            {idx % labelEvery === 0 ? it.label : ''}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#777', marginTop: 6 }}>Highest: {format(max)}</div>
    </div>
  );
}
