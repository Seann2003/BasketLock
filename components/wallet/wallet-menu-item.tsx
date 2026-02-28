"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { UiWallet, UiWalletAccount } from "@wallet-standard/react";
import { useConnect } from "@wallet-standard/react";

interface WalletMenuItemProps {
  wallet: UiWallet;
  onSelect: (account: UiWalletAccount) => void;
}

export function WalletMenuItem({ wallet, onSelect }: WalletMenuItemProps) {
  const [, connect] = useConnect(wallet);

  return (
    <DropdownMenuItem
      onClick={async () => {
        if (wallet.accounts.length > 0) {
          onSelect(wallet.accounts[0]);
        } else {
          try {
            const accounts = await connect();
            if (accounts.length > 0) {
              onSelect(accounts[0]);
            }
          } catch (e) {
            console.error("Failed to connect wallet:", e);
          }
        }
      }}
    >
      {wallet.icon && (
        <img
          src={wallet.icon}
          alt={wallet.name}
          className="h-4 w-4 mr-2"
        />
      )}
      {wallet.name}
    </DropdownMenuItem>
  );
}
