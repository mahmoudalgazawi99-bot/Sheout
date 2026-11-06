export const metadata = {
  title: 'Sheout Stores',
  manifest: '/api/store/manifest',
  icons: {
    icon: '/api/store/icon?size=192',
    apple: '/api/store/icon?size=180',
  },
  appleWebApp: {
    capable: true,
    title: 'Sheout',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  themeColor: '#141414',
};

export default function StoreLayout({ children }) {
  return (
    <div dir="rtl" lang="ar">
      {children}
    </div>
  );
}
