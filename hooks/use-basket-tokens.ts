"use client";

import type { Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import { fetchAllBasketTokens } from "@/lib/solana/accounts";
import { useRpc } from "./use-rpc";

export function useBasketTokens(basketAddress: Address | undefined) {
  const { rpc } = useRpc();

  return useQuery({
    queryKey: ["basketlock", "basket-tokens", basketAddress],
    queryFn: () => fetchAllBasketTokens(rpc, basketAddress!),
    enabled: !!basketAddress,
  });
}
