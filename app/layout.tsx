import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Telefonu un datoru remonts Rīgā | iLab — dizaina prototips',
  description: 'iLab servisa mājaslapas dizaina prototips. Telefonu, datoru un citu ierīču remonts Rīgā.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="lv">
      <body>{children}</body>
    </html>
  );
}
