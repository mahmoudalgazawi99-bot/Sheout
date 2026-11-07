'use client';

import { useEffect, useState } from 'react';
import { theme } from '@/lib/theme';

export default function StoreBell({ count, children }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
        const p = count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge();
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) {}
  }, [count]);

  function onPanelClick(e) {
    if (e.target.closest && e.target.closest('a')) setOpen(false);
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label="الإشعارات"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'relative',
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          background: theme.ink,
          color: theme.gold,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              insetInlineEnd: -4,
              minWidth: 20,
              height: 20,
              padding: '0 5px',
              borderRadius: 999,
              background: theme.gold,
              color: theme.ink,
              fontSize: 12,
              fontWeight: 700,
              lineHeight: '20px',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          onClick={onPanelClick}
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 0px) + 76px)',
            left: 12,
            right: 12,
            maxWidth: 560,
            margin: '0 auto',
            zIndex: 50,
            background: theme.bg,
            border: `1px solid ${theme.line}`,
            borderRadius: theme.radius,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.18)',
            padding: 14,
            maxHeight: '75vh',
            overflowY: 'auto',
          }}
        >
          {children}
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              marginTop: 12,
              width: '100%',
              padding: 10,
              borderRadius: 999,
              border: `1px solid ${theme.line}`,
              background: theme.card,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            إغلاق
          </button>
        </div>
      )}
    </div>
  );
}
