import { theme } from '@/lib/theme';

export default function SizeGuide({ guide, modelInfo, lang }) {
  const ar = lang === 'ar';
  const has = guide && Array.isArray(guide.rows) && guide.rows.length > 0 && Array.isArray(guide.cols);
  if (!has && !modelInfo) return null;

  const unit = guide && guide.unit === 'in' ? (ar ? 'إنش' : 'in') : ar ? 'سم' : 'cm';
  const cell = { padding: '8px 10px', textAlign: 'center', borderBottom: `1px solid ${theme.line}`, fontSize: 13 };

  return (
    <section
      style={{
        marginTop: 18,
        background: theme.card,
        border: `1px solid ${theme.line}`,
        borderRadius: theme.radius,
        padding: 14,
      }}
    >
      <div style={{ fontFamily: theme.serif, fontSize: 17, fontWeight: 600 }}>
        📏 {ar ? 'المقاس والقياسات' : 'Size & fit'}
      </div>

      {modelInfo ? <div style={{ fontSize: 14, lineHeight: 1.8, marginTop: 6 }}>{modelInfo}</div> : null}

      {has && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            {ar ? `جدول المقاسات (${unit})` : `Size chart (${unit})`}
          </summary>
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 240 }}>
              <thead>
                <tr style={{ background: theme.goldSoft }}>
                  <th style={cell}>{ar ? 'المقاس' : 'Size'}</th>
                  {guide.cols.map((c, i) => (
                    <th key={i} style={cell}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guide.rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...cell, fontWeight: 700 }}>{r.size}</td>
                    {guide.cols.map((_, k) => (
                      <td key={k} style={cell}>
                        {r.v && r.v[k] ? r.v[k] : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
