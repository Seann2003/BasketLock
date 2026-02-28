"use client";

import * as React from "react";
import { VaultCard } from "./VaultCard";
import type { BasketView } from "@/lib/types";

interface VaultGridProps {
  baskets: BasketView[];
  searchQuery: string;
}

export function VaultGrid({ baskets, searchQuery }: VaultGridProps) {
  const filtered = React.useMemo(() => {
    if (!searchQuery.trim()) return baskets;
    const query = searchQuery.toLowerCase();
    return baskets.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.owner.toLowerCase().includes(query) ||
        b.basketId.toString().includes(query),
    );
  }, [baskets, searchQuery]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">No baskets found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search query
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((basket) => (
        <VaultCard key={basket.basketId.toString()} basket={basket} />
      ))}
    </div>
  );
}
