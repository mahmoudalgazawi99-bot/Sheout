import AutoRefresh from '@/components/autorefresh';

export const metadata = {
  title: 'Sheout Warehouse',
  manifest: '/api/warehouse/manifest',
  icons: {
    icon: '/api/store/icon?size=192&variant=warehouse',
    apple: '/api/store/icon?size=180&variant=warehouse',
  },
  appleWebApp: {
    capable: true,
    title: 'Sheout WH',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  themeColor: '#141414',
};

export default function WarehouseLayout({ children }) {
  return (
    <div dir="rtl" lang="ar">
      <AutoRefresh global seconds={20} />
      {children}
    </div>
  );
}
