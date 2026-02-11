"use client";

import * as React from "react";

import { VaultCard } from "./VaultCard";
import type { Vault, VaultStatus } from "../types";

interface VaultGridProps {
  vaults: Vault[];
  filter: VaultStatus | "all";
  searchQuery: string;
  onView?: (vault: Vault) => void;
  onManage?: (vault: Vault) => void;
  onTransfer?: (vault: Vault) => void;
}

export function VaultGrid({
  vaults,
  filter,
  searchQuery,
  onView,
  onManage,
  onTransfer,
}: VaultGridProps) {
  const filteredVaults = React.useMemo(() => {
    let result = vaults;

    if (filter !== "all") {
      result = result.filter((vault) => vault.status === filter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (vault) =>
          vault.name.toLowerCase().includes(query) ||
          vault.description.toLowerCase().includes(query) ||
          vault.tokens.some((token) =>
            token.symbol.toLowerCase().includes(query)
          )
      );
    }

    return result;
  }, [vaults, filter, searchQuery]);

  if (filteredVaults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">No vaults found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredVaults.map((vault) => (
        <VaultCard
          key={vault.id}
          vault={vault}
          onView={onView}
          onManage={onManage}
          onTransfer={onTransfer}
        />
      ))}
    </div>
  );
}
