"use client";

import Link from "next/link";
import { ArrowLeft, User, Coins } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBasket } from "@/hooks/use-basket";
import { useBasketTokens } from "@/hooks/use-basket-tokens";
import { useWalletAccount } from "@/hooks/use-wallet-account";
import { TokenList } from "./token-list";
import { DepositForm } from "./deposit-form";
import { WithdrawForm } from "./withdraw-form";

interface BasketDetailProps {
  basketId: bigint;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function BasketDetail({ basketId }: BasketDetailProps) {
  const { data: basket, isLoading, error } = useBasket(basketId);
  const { data: tokens, isLoading: tokensLoading } = useBasketTokens(
    basket?.address,
  );
  const { account, isConnected } = useWalletAccount();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-destructive font-medium">Failed to load basket</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  }

  if (!basket) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground font-medium">Basket not found</p>
        <Link href="/vaults">
          <Button variant="ghost" size="sm" className="mt-2 gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Baskets
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/vaults">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">{basket.name}</h1>
        <Badge variant="secondary">{basket.effectiveFeeBps / 100}% fee</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Basket Info</CardTitle>
            <CardDescription>
              Basket #{basket.basketId.toString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Owner
                </span>
                <span className="font-mono">{truncateAddress(basket.owner)}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  Share Mint
                </span>
                <span className="font-mono">
                  {truncateAddress(basket.shareMint)}
                </span>
              </div>
            </div>

            {tokensLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <TokenList tokens={tokens ?? []} />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {isConnected && account ? (
            <>
              <Card>
                <CardContent className="pt-6">
                  <DepositForm account={account} basket={basket} tokens={tokens ?? []} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <WithdrawForm account={account} basket={basket} tokens={tokens ?? []} />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-4">
                  Connect wallet to deposit or withdraw
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
