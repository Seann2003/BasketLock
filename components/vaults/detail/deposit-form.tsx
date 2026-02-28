"use client";

import * as React from "react";
import type { Address } from "@solana/kit";
import type { UiWalletAccount } from "@wallet-standard/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeposit } from "@/hooks/use-deposit";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useWalletAccount } from "@/hooks/use-wallet-account";
import type { BasketView } from "@/lib/types";
import type { ParsedBasketToken } from "@/lib/solana/types";

interface DepositFormProps {
  account: UiWalletAccount;
  basket: BasketView;
  tokens: ParsedBasketToken[];
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function TokenAmountInput({
  token,
  value,
  onChange,
}: {
  token: ParsedBasketToken;
  value: string;
  onChange: (v: string) => void;
}) {
  const { publicKey } = useWalletAccount();
  const { data: balance } = useTokenBalance(publicKey, token.mint);

  const formattedBalance =
    balance !== undefined
      ? (Number(balance) / 10 ** token.decimals).toFixed(token.decimals)
      : "...";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-mono">
          {truncateAddress(token.mint)}
        </Label>
        <span className="text-[10px] text-muted-foreground">
          Balance: {formattedBalance}
        </span>
      </div>
      <Input
        type="number"
        placeholder="0.0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="0"
        step="any"
        disabled={!token.enabled}
      />
    </div>
  );
}

export function DepositForm({ account, basket, tokens }: DepositFormProps) {
  const enabledTokens = tokens.filter((t) => t.enabled);
  const [amounts, setAmounts] = React.useState<Record<string, string>>({});
  const deposit = useDeposit(account, basket.address);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tokenMints: Address[] = [];
    const depositAmounts: bigint[] = [];

    for (const token of enabledTokens) {
      const raw = amounts[token.mint] || "0";
      const parsed = parseFloat(raw);
      if (parsed <= 0) continue;
      tokenMints.push(token.mint);
      depositAmounts.push(BigInt(Math.floor(parsed * 10 ** token.decimals)));
    }

    if (tokenMints.length === 0) {
      toast.error("Enter at least one token amount");
      return;
    }

    try {
      await deposit.mutateAsync({
        basketAddress: basket.address,
        basketId: basket.basketId,
        shareMint: basket.shareMint,
        vaultAuthority: basket.vaultAuthority,
        amounts: depositAmounts,
        tokenMints,
      });
      toast.success("Deposit successful");
      setAmounts({});
    } catch (err) {
      toast.error("Deposit failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  if (enabledTokens.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No enabled tokens to deposit
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-medium">Deposit</h3>
      <div className="space-y-3">
        {enabledTokens.map((token) => (
          <TokenAmountInput
            key={token.mint}
            token={token}
            value={amounts[token.mint] || ""}
            onChange={(v) =>
              setAmounts((prev) => ({ ...prev, [token.mint]: v }))
            }
          />
        ))}
      </div>
      <Button
        type="submit"
        size="sm"
        className="w-full"
        disabled={deposit.isPending}
      >
        {deposit.isPending ? "Depositing..." : "Deposit"}
      </Button>
    </form>
  );
}
