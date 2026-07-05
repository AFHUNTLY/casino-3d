'use client';

import { useState, useCallback } from 'react';
import { BrowserProvider, formatEther } from 'ethers';

export interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  connecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    connecting: false,
    error: null,
  });

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setState((s) => ({ ...s, error: 'MetaMask not found. Install MetaMask to play.' }));
      return;
    }

    setState((s) => ({ ...s, connecting: true, error: null }));

    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(accounts[0]);

      setState({
        address: accounts[0],
        balance: formatEther(balance),
        chainId: Number(network.chainId),
        connecting: false,
        error: null,
      });

      // Listen for account changes
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setState({ address: null, balance: null, chainId: null, connecting: false, error: null });
        } else {
          refreshBalance(accounts[0]);
        }
      });

      // Listen for chain changes
      (window as any).ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      async function refreshBalance(addr: string) {
        const provider = new BrowserProvider((window as any).ethereum);
        const bal = await provider.getBalance(addr);
        setState((s) => ({ ...s, address: addr, balance: formatEther(bal) }));
      }
    } catch (err: any) {
      setState((s) => ({
        ...s,
        connecting: false,
        error: err.message || 'Failed to connect wallet',
      }));
    }
  }, []);

  return { ...state, connect };
}
