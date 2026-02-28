"use client";

import { Badge } from "@/components/ui/badge";
import type { ParsedBasketToken } from "@/lib/solana/types";

interface TokenListProps {
  tokens: ParsedBasketToken[];
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function TokenList({ tokens }: TokenListProps) {
  if (tokens.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No tokens in this basket
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Tokens ({tokens.length})</h3>
      <div className="border rounded-sm divide-y">
        {tokens.map((token) => (
          <div
            key={token.mint}
            className="flex items-center justify-between px-3 py-2 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono">{truncateAddress(token.mint)}</span>
              <Badge variant={token.enabled ? "secondary" : "outline"} className="text-[10px]">
                {token.enabled ? "enabled" : "disabled"}
              </Badge>
            </div>
            <span className="text-muted-foreground">
              {token.decimals} decimals
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
