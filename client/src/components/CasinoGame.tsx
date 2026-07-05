'use client';

import { useRef, useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { initCasino, CasinoApp } from '@/game/CasinoWorld';
import { BASE_SEPOLIA_CHAIN_ID } from '@/lib/contracts';

export default function CasinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<CasinoApp | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [interactionPrompt, setInteractionPrompt] = useState('');
  const wallet = useWallet();

  // Initialize PlayCanvas engine
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    initCasino(canvasRef.current).then((app) => {
      appRef.current = app;
      setLoaded(true);

      // Callback when player looks at something interactable
      app.onInteractionAvailable = (prompt: string) => {
        setInteractionPrompt(prompt);
      };

      app.onInteractionEnd = () => {
        setInteractionPrompt('');
      };
    });

    return () => {
      appRef.current?.destroy();
      appRef.current = null;
    };
  }, []);

  // Pointer lock handling
  useEffect(() => {
    const onLockChange = () => {
      setPointerLocked(document.pointerLockElement === canvasRef.current);
    };
    document.addEventListener('pointerlockchange', onLockChange);
    return () => document.removeEventListener('pointerlockchange', onLockChange);
  }, []);

  const handleCanvasClick = () => {
    canvasRef.current?.requestPointerLock();
  };

  const isWrongChain = wallet.chainId !== null && wallet.chainId !== BASE_SEPOLIA_CHAIN_ID;

  return (
    <div id="app-container" style={{ width: '100vw', height: '100vh' }}>
      {/* PlayCanvas Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* UI Overlay */}
      <div className="casino-ui">
        {/* Top Bar — Wallet */}
        <div className="top-bar">
          <div style={{ fontWeight: 800, fontSize: 20, color: '#ffd700', letterSpacing: 1 }}>
            🎰 ONCHAIN CASINO
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
              {wallet.connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>

        {/* Crosshair (only when pointer locked) */}
        {pointerLocked && <div className="crosshair" />}

        {/* Click to play overlay */}
        {loaded && !pointerLocked && (
          <div className="click-to-play" onClick={handleCanvasClick}>
            <div className="click-to-play-text">
              {wallet.address ? 'Click to play' : 'Connect wallet, then click to play'}
              <br />
              <span style={{ fontSize: 13, color: '#666' }}>
                WASD to move • Mouse to look • ESC to release
              </span>
            </div>
          </div>
        )}

        {/* Interaction prompt */}
        <div className={`interaction-prompt ${interactionPrompt ? 'visible' : ''}`}>
          {interactionPrompt}
        </div>

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
