"use client";

import type { ReactNode } from "react";
import { Wallet } from "lucide-react";
import { useWalletAccount } from "@/hooks/use-wallet-account";
import { ConnectButton } from "./connect-button";

export function WalletGuard({ children }: { children: ReactNode }) {
  const { isConnected } = useWalletAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <Wallet className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="text-muted-foreground font-medium">Connect your wallet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Connect a Solana wallet to continue
          </p>
        </div>
        <ConnectButton />
      </div>
    );
  }

  return <>{children}</>;
}
