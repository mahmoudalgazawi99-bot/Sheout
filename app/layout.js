import './globals.css';
import { getLang } from '@/lib/serverlang';
import { LangProvider } from '@/components/LangProvider';

export const metadata = {
  title: 'Sheout',
  description: 'Fashion Marketplace - Jordan',
};

export default async function RootLayout({ children }) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
