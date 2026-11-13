import AutoRefresh from '@/components/autorefresh';

export const metadata = {
  title: 'Sheout Courier',
  manifest: '/api/courier/manifest',
  icons: {
    icon: '/api/store/icon?size=192&variant=courier',
    apple: '/api/store/icon?size=180&variant=courier',
  },
  appleWebApp: {
    capable: true,
    title: 'Sheout Courier',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  themeColor: '#141414',
};

export default function CourierLayout({ children }) {
  return (
    <div dir="rtl" lang="ar">
      <AutoRefresh global seconds={20} />
      {children}
    </div>
  );
}
