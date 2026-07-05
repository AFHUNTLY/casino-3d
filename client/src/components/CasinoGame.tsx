'use client';

import { useRef, useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { createCasino, CasinoScene } from '@/game/CasinoScene';
import { BASE_SEPOLIA_CHAIN_ID } from '@/lib/contracts';

export default function CasinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CasinoScene | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const wallet = useWallet();

  // Initialize Three.js scene
  useEffect(() => {
    let disposed = false;
    let scene: CasinoScene | null = null;

    // Small delay to ensure canvas is mounted and sized
    const timer = setTimeout(() => {
      if (disposed || !canvasRef.current) return;
      
      try {
        scene = createCasino(canvasRef.current);
        sceneRef.current = scene;
        setLoaded(true);
        console.log('[Casino] Scene initialized successfully');
      } catch (err) {
        console.error('[Casino] Failed to init casino scene:', err);
      }
    }, 100);

    const onLockChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setPointerLocked(detail);
    };
    window.addEventListener('casino:pointerlock', onLockChange);

    return () => {
      disposed = true;
      clearTimeout(timer);
      window.removeEventListener('casino:pointerlock', onLockChange);
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  const handleCanvasClick = () => {
    canvasRef.current?.requestPointerLock();
  };

  const isWrongChain = wallet.chainId !== null && wallet.chainId !== BASE_SEPOLIA_CHAIN_ID;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0608' }}>
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
      />

      {/* UI Overlay */}
      <div className="casino-ui">
        {/* Top Bar */}
        <div className="top-bar">
          <div style={{ fontWeight: 800, fontSize: 22, color: '#ffd700', letterSpacing: 2, textShadow: '0 0 20px rgba(255,215,0,0.5)' }}>
            💎 DIAMOND CASINO
          </div>

          {wallet.address ? (
            <div className="wallet-display">
              <span className="wallet-address">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </span>
              {wallet.balance && (
                <span className="wallet-balance">
                  {parseFloat(wallet.balance).toFixed(4)} ETH
                </span>
              )}
              {isWrongChain && (
                <span style={{ color: '#ef4444', fontSize: 12 }}>⚠ Switch to Base Sepolia</span>
              )}
            </div>
          ) : (
            <button
              className="connect-btn"
              onClick={wallet.connect}
              disabled={wallet.connecting}
            >
              {wallet.connecting ? 'Connecting...' : '🦊 Connect Wallet'}
            </button>
          )}
        </div>

        {/* Click to play overlay */}
        {loaded && !pointerLocked && (
          <div className="click-to-play" onClick={handleCanvasClick}>
            <div className="click-to-play-text">
              <span style={{ fontSize: 28, fontWeight: 700, color: '#ffd700' }}>CLICK TO ENTER</span>
              <br />
              <span style={{ fontSize: 14, color: '#888' }}>
                WASD to walk • Mouse to look • ESC to release mouse
              </span>
            </div>
          </div>
        )}

        {/* Crosshair when locked */}
        {pointerLocked && <div className="crosshair" />}

        {/* Error toast */}
        {wallet.error && (
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(239, 68, 68, 0.9)',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {wallet.error}
          </div>
        )}
      </div>
    </div>
  );
}
