'use client';

import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    // Redirect to the standalone PlayCanvas casino
    window.location.href = '/casino.html';
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 100%)',
      color: '#ffd700',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 20 }}>
        💎 DIAMOND CASINO
      </div>
      <div style={{ color: '#888' }}>Loading 3D environment...</div>
      <div style={{
        marginTop: 30,
        width: 40,
        height: 40,
        border: '3px solid rgba(255,215,0,0.2)',
        borderTopColor: '#ffd700',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
