export const metadata = {
  title: 'Sheout',
  description: 'Fashion Marketplace - Jordan',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
