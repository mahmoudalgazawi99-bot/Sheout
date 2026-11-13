'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AutoRefresh({ seconds = 30, global = false }) {
  const router = useRouter();
  const last = useRef(0);

  useEffect(() => {
    if (global) window.__sheoutAutoRefresh = (window.__sheoutAutoRefresh || 0) + 1;

    function refresh(force) {
      if (!global && window.__sheoutAutoRefresh > 0) return;
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - last.current < 4000) return;
      if (!force && now - last.current < (seconds - 1) * 1000) return;
      last.current = now;
      router.refresh();
    }

    const timer = setInterval(() => refresh(false), seconds * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh(true);
    };
    const onOnline = () => refresh(true);

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
      window.removeEventListener('online', onOnline);
      if (global) window.__sheoutAutoRefresh = Math.max(0, (window.__sheoutAutoRefresh || 1) - 1);
    };
  }, [router, seconds, global]);

  return null;
}
