"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBasket } from "@/lib/solana/accounts";
import { useRpc } from "./use-rpc";
import { useConfig } from "./use-config";
import { toBasketView, type BasketView } from "@/lib/types";

export function useBasket(basketId: bigint | undefined) {
  const { rpc } = useRpc();
  const { data: config } = useConfig();

  return useQuery<BasketView | null>({
    queryKey: ["basketlock", "basket", basketId?.toString()],
    queryFn: async () => {
      if (basketId === undefined) return null;
      const basket = await fetchBasket(rpc, basketId);
      if (!basket) return null;
      return toBasketView(basket, config ?? null);
    },
    enabled: basketId !== undefined && config !== undefined,
  });
}
