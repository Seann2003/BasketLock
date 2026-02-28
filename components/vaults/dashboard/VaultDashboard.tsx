"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VaultFilters } from "./VaultFilters";
import { VaultGrid } from "./VaultGrid";
import { useBaskets } from "@/hooks/use-baskets";
import { useWalletAccount } from "@/hooks/use-wallet-account";

export function VaultDashboard() {
  const { data: baskets, isLoading, error } = useBaskets();
  const { publicKey, isConnected } = useWalletAccount();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showMyBaskets, setShowMyBaskets] = React.useState(false);

  const displayedBaskets = React.useMemo(() => {
    if (!baskets) return [];
    if (showMyBaskets && publicKey) {
      return baskets.filter((b) => b.owner === publicKey);
    }
    return baskets;
  }, [baskets, showMyBaskets, publicKey]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Baskets</CardTitle>
          <CardDescription>Browse and manage token baskets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <VaultFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showMyBaskets={showMyBaskets}
            onMyBasketsChange={setShowMyBaskets}
            isConnected={isConnected}
          />

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-destructive font-medium">Failed to load baskets</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message}
              </p>
            </div>
          ) : (
            <VaultGrid
              baskets={displayedBaskets}
              searchQuery={searchQuery}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
