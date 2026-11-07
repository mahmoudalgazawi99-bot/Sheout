'use client';

import { useEffect, useState } from 'react';
import { theme } from '@/lib/theme';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PushSetup({
  publicKey,
  apiBase = '/api/store/push',
  swUrl = '/store-sw.js',
  scope = '/store',
}) {
  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const ua = navigator.userAgent || '';
      const isIOS = /iphone|ipad|ipod/i.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
      const standalone =
        window.navigator.standalone === true ||
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);

      if (isIOS && !standalone) {
        if (!cancelled) setState('needs-install');
        return;
      }
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        if (!cancelled) setState('unsupported');
        return;
      }
      if (!publicKey) {
        if (!cancelled) setState('unconfigured');
        return;
      }

      try {
        await navigator.serviceWorker.register(swUrl, { scope });
        const reg = await navigator.serviceWorker.ready;
        if (Notification.permission === 'denied') {
          if (!cancelled) setState('denied');
          return;
        }
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setState(sub && Notification.permission === 'granted' ? 'enabled' : 'ready');
      } catch {
        if (!cancelled) setState('unsupported');
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [publicKey, swUrl, scope]);

  async function enable() {
    setBusy(true);
    setMessage('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'ready');
        setMessage('لازم توافق على الإشعارات عشان توصلك الطلبات');
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      const res = await fetch(`${apiBase}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'failed');
      }
      setState('enabled');
      setMessage('تم تفعيل الإشعارات على هذا الجهاز');
    } catch (e) {
      setMessage(e && e.message && e.message !== 'failed' ? e.message : 'تعذّر تفعيل الإشعارات، حاول مرة أخرى');
    }
    setBusy(false);
  }

  async function sendTest() {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`${apiBase}/test`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      setMessage(res.ok ? 'تم إرسال الإشعار، شوف جوالك' : data.error || 'تعذّر إرسال الإشعار');
    } catch {
      setMessage('مشكلة في الاتصال، حاول مرة أخرى');
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    setMessage('');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch(`${apiBase}/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
      }
      setState('ready');
      setMessage('تم إيقاف الإشعارات على هذا الجهاز');
    } catch {
      setMessage('تعذّر إيقاف الإشعارات');
    }
    setBusy(false);
  }

  const btn = (primary) => ({
    padding: '11px 16px',
    borderRadius: 999,
    border: primary ? 'none' : `1px solid ${theme.line}`,
    background: primary ? theme.ink : theme.card,
    color: primary ? theme.gold : theme.ink,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    opacity: busy ? 0.6 : 1,
  });

  const note = { fontSize: 14, lineHeight: 1.8, margin: '6px 0 0', color: theme.ink };

  return (
    <section
      style={{
        marginTop: 16,
        background: theme.card,
        border: `1px solid ${theme.line}`,
        borderRadius: theme.radius,
        boxShadow: theme.shadow,
        padding: 14,
      }}
    >
      <div style={{ fontWeight: 700 }}>الإشعارات</div>

      {state === 'loading' && <p style={note}>جارٍ التحقق...</p>}

      {state === 'needs-install' && (
        <p style={note}>
          عشان توصلك إشعارات الطلبات على الآيفون لازم تثبّت التطبيق أولاً: افتح هالصفحة من Safari، اضغط زر
          المشاركة، ثم &quot;إضافة إلى الشاشة الرئيسية&quot;. بعدها افتح التطبيق من الأيقونة، سجّل الدخول،
          وفعّل الإشعارات من هون. (الآيفون لازم يكون iOS 16.4 أو أحدث)
        </p>
      )}

      {state === 'unsupported' && (
        <p style={note}>
          هذا المتصفح ما بيدعم الإشعارات. استخدم Chrome على أندرويد، أو ثبّت التطبيق على آيفون (iOS 16.4 أو أحدث).
        </p>
      )}

      {state === 'unconfigured' && <p style={note}>الإشعارات غير مهيأة بعد. تواصل مع إدارة المنصة.</p>}

      {state === 'denied' && (
        <p style={note}>
          الإشعارات محظورة لهذا التطبيق. فعّلها من إعدادات الجهاز، ثم الإشعارات، ثم التطبيق.
        </p>
      )}

      {state === 'ready' && (
        <div style={{ marginTop: 10 }}>
          <button type="button" style={btn(true)} disabled={busy} onClick={enable}>
            تفعيل الإشعارات
          </button>
        </div>
      )}

      {state === 'enabled' && (
        <div style={{ marginTop: 10 }}>
          <p style={{ ...note, color: '#177a3c', fontWeight: 600, marginTop: 0 }}>الإشعارات مفعّلة على هذا الجهاز ✓</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <button type="button" style={btn(true)} disabled={busy} onClick={sendTest}>
              إرسال إشعار تجريبي
            </button>
            <button type="button" style={btn(false)} disabled={busy} onClick={disable}>
              إيقاف الإشعارات
            </button>
          </div>
        </div>
      )}

      {message && <p style={{ ...note, color: theme.muted }}>{message}</p>}
    </section>
  );
}
