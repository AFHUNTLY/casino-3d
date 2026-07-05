'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const CasinoGame = dynamic(() => import('@/components/CasinoGame'), {
  ssr: false,
  loading: () => (
    <div className="loading-screen">
      <div className="loading-title">ONCHAIN CASINO</div>
      <div className="loading-subtitle">Loading 3D environment...</div>
      <div className="loading-spinner" />
    </div>
  ),
});

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="loading-screen">
        <div className="loading-title">ONCHAIN CASINO</div>
        <div className="loading-subtitle">Initializing...</div>
        <div className="loading-spinner" />
      </div>
    );
  }

  return <CasinoGame />;
}
