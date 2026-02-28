"use client";

import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWalletAccount } from "@/hooks/use-wallet-account";
import { WalletMenuItem } from "./wallet-menu-item";

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function ConnectButton() {
  const { account, setAccount, wallets, isConnected } = useWalletAccount();

  if (isConnected && account) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="gap-1.5">
              <Wallet className="h-3.5 w-3.5" />
              {truncateAddress(account.address)}
              <ChevronDown className="h-3 w-3" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(account.address);
            }}
          >
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setAccount(undefined)}>
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (wallets.length === 0) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5">
        <Wallet className="h-3.5 w-3.5" />
        No Wallets Found
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            Connect Wallet
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        {wallets.map((wallet) => (
          <WalletMenuItem
            key={wallet.name}
            wallet={wallet}
            onSelect={(walletAccount) => setAccount(walletAccount)}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
