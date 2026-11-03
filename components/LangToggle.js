'use client';

import { useRouter } from 'next/navigation';
import { useLang } from '@/components/LangProvider';
import { theme } from '@/lib/theme';

export default function LangToggle() {
  const router = useRouter();
  const lang = useLang();

  function switchLang() {
    const next = lang === 'ar' ? 'en' : 'ar';
    document.cookie = `sheout_lang=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={switchLang}
      style={{
        border: `1px solid ${theme.gold}`,
        background: 'transparent',
        color: theme.ink,
        padding: '8px 14px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {lang === 'ar' ? 'English' : 'عربي'}
    </button>
  );
}
