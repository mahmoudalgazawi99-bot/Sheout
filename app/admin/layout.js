export const metadata = {
  title: 'Sheout Admin',
  manifest: '/api/admin/manifest',
  icons: {
    icon: '/api/store/icon?size=192&variant=admin',
    apple: '/api/store/icon?size=180&variant=admin',
  },
  appleWebApp: {
    capable: true,
    title: 'Sheout Admin',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  themeColor: '#141414',
};

export default function AdminLayout({ children }) {
  return (
    <div dir="ltr" lang="en">
      {children}
    </div>
  );
}
