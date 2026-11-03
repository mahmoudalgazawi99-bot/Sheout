import { cookies } from 'next/headers';
import { DEFAULT_LANG } from '@/lib/i18n';

export async function getLang() {
  const store = await cookies();
  const v = store.get('sheout_lang')?.value;
  return v === 'en' || v === 'ar' ? v : DEFAULT_LANG;
}
