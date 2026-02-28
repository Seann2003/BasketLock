"use client";

import * as React from "react";
import type { UiWalletAccount } from "@wallet-standard/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWithdraw } from "@/hooks/use-withdraw";
import { useShareBalance } from "@/hooks/use-share-balance";
import { QSHARE_DECIMALS } from "@/lib/solana/constants";
import type { BasketView } from "@/lib/types";
import type { ParsedBasketToken } from "@/lib/solana/types";

interface WithdrawFormProps {
  account: UiWalletAccount;
  basket: BasketView;
  tokens: ParsedBasketToken[];
}

export function WithdrawForm({ account, basket, tokens }: WithdrawFormProps) {
  const [amount, setAmount] = React.useState("");
  const withdraw = useWithdraw(account);
  const { data: shareBalance } = useShareBalance(basket.shareMint);

  const formattedBalance =
    shareBalance !== undefined
      ? (Number(shareBalance) / 10 ** QSHARE_DECIMALS).toFixed(QSHARE_DECIMALS)
      : "...";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const sharesToBurn = BigInt(Math.floor(parsed * 10 ** QSHARE_DECIMALS));

    try {
      await withdraw.mutateAsync({
        basketAddress: basket.address,
        shareMint: basket.shareMint,
        vaultAuthority: basket.vaultAuthority,
        sharesToBurn,
        tokenMints: tokens.filter((t) => t.enabled).map((t) => t.mint),
      });
      toast.success("Withdrawal successful");
      setAmount("");
    } catch (err) {
      toast.error("Withdrawal failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-medium">Withdraw</h3>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">QSHARE to burn</Label>
          <span className="text-[10px] text-muted-foreground">
            Balance: {formattedBalance}
          </span>
        </div>
        <Input
          type="number"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="any"
        />
      </div>
      <Button
        type="submit"
        size="sm"
        className="w-full"
        variant="outline"
        disabled={withdraw.isPending}
      >
        {withdraw.isPending ? "Withdrawing..." : "Withdraw"}
      </Button>
    </form>
  );
}
