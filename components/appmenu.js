import Link from 'next/link';
import { theme } from '@/lib/theme';

export function MenuGrid({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 16 }}>
      {children}
    </div>
  );
}

export function MenuCard({ href, icon, title, sub, badge, alert }) {
  const showBadge = badge !== undefined && badge !== null && badge !== 0 && badge !== '';
  return (
    <Link
      href={href}
      style={{
        position: 'relative',
        display: 'block',
        textDecoration: 'none',
        color: theme.ink,
        background: theme.card,
        border: `1px solid ${alert ? '#e2b0b0' : theme.line}`,
        borderRadius: theme.radius,
        boxShadow: theme.shadow,
        padding: 16,
        minHeight: 104,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div style={{ fontWeight: 700, marginTop: 8 }}>{title}</div>
      {sub ? <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{sub}</div> : null}
      {showBadge ? (
        <span
          style={{
            position: 'absolute',
            top: 10,
            insetInlineEnd: 10,
            minWidth: 24,
            height: 24,
            padding: '0 7px',
            borderRadius: 999,
            background: alert ? '#b00' : theme.ink,
            color: alert ? '#fff' : theme.gold,
            fontSize: 13,
            fontWeight: 700,
            lineHeight: '24px',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export function StatStrip({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 10, marginTop: 16 }}>
      {items.map((it) => (
        <div
          key={it.label}
          style={{
            background: it.dark ? theme.ink : theme.card,
            color: it.dark ? theme.gold : theme.ink,
            border: `1px solid ${it.dark ? theme.ink : theme.line}`,
            borderRadius: theme.radius,
            boxShadow: theme.shadow,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, color: it.dark ? theme.gold : theme.muted }}>{it.label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}

export function Banner({ href, dark, children }) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        marginTop: 14,
        padding: '12px 16px',
        borderRadius: theme.radius,
        background: dark ? theme.ink : theme.goldSoft,
        color: dark ? theme.gold : theme.ink,
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  );
}
