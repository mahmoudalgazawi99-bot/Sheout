'use client';

import { useEffect, useState } from 'react';
import { theme } from '@/lib/theme';

export default function InstallPrompt({ lang }) {
  const ar = lang === 'ar';
  const [mode, setMode] = useState(null);
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    }

    const standalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
    if (standalone) return undefined;

    try {
      if (localStorage.getItem('sheout_install_dismissed') === '1') return undefined;
    } catch {}

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setMode('ios');

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setMode('android');
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem('sheout_install_dismissed', '1');
    } catch {}
    setMode(null);
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {}
    setDeferred(null);
    setMode(null);
  }

  if (!mode) return null;

  return (
    <div
      style={{
        marginTop: 14,
        padding: '12px 14px',
        borderRadius: theme.radius,
        background: theme.goldSoft,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div style={{ flex: 1, fontSize: 14, lineHeight: 1.7 }}>
        <b>{ar ? 'ثبّت تطبيق Sheout' : 'Install the Sheout app'}</b>
        <div style={{ fontSize: 13, color: theme.muted }}>
          {mode === 'ios'
            ? ar
              ? 'اضغط زر المشاركة ثم "إضافة إلى الشاشة الرئيسية".'
              : 'Tap the Share button, then "Add to Home Screen".'
            : ar
              ? 'تسوّق أسرع وتابع طلباتك من الشاشة الرئيسية.'
              : 'Shop faster and track orders from your home screen.'}
        </div>
      </div>
      {mode === 'android' && (
        <button
          type="button"
          onClick={install}
          style={{
            padding: '9px 16px',
            borderRadius: 999,
            border: 'none',
            background: theme.ink,
            color: theme.gold,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {ar ? 'تثبيت' : 'Install'}
        </button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="close"
        style={{ border: 'none', background: 'none', fontSize: 20, color: theme.muted, cursor: 'pointer' }}
      >
        ×
      </button>
    </div>
  );
}
