import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OnChain Casino 3D',
  description: 'A first-person 3D casino powered by PlayCanvas and Base Sepolia',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
