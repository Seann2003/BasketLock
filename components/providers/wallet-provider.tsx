"use client";

import { type ReactNode, useCallback, useMemo } from "react";
import { SelectedWalletAccountContextProvider } from "@solana/react";
import type { UiWallet } from "@wallet-standard/react";

const STORAGE_KEY = "basketlock:wallet";

function isSolanaWallet(wallet: UiWallet): boolean {
  return wallet.chains.some((c) => c.startsWith("solana:"));
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const stateSync = useMemo(
    () => ({
      getSelectedWallet: () => {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(STORAGE_KEY);
      },
      storeSelectedWallet: (accountKey: string) => {
        localStorage.setItem(STORAGE_KEY, accountKey);
      },
      deleteSelectedWallet: () => {
        localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [],
  );

  const filterWallets = useCallback(isSolanaWallet, []);

  return (
    <SelectedWalletAccountContextProvider
      filterWallets={filterWallets}
      stateSync={stateSync}
    >
      {children}
    </SelectedWalletAccountContextProvider>
  );
}
