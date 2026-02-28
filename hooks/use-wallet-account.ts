"use client";

import { useSelectedWalletAccount } from "@solana/react";
import type { Address } from "@solana/kit";

export function useWalletAccount() {
  const [account, setAccount, wallets] = useSelectedWalletAccount();

  return {
    account,
    setAccount,
    wallets,
    isConnected: !!account,
    publicKey: account?.address as Address | undefined,
  };
}
