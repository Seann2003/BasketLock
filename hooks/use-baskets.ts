"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllBaskets } from "@/lib/solana/accounts";
import { useRpc } from "./use-rpc";
import { useConfig } from "./use-config";
import { toBasketView, type BasketView } from "@/lib/types";

export function useBaskets() {
  const { rpc } = useRpc();
  const { data: config } = useConfig();

  return useQuery<BasketView[]>({
    queryKey: ["basketlock", "baskets"],
    queryFn: async () => {
      const baskets = await fetchAllBaskets(rpc);
      return Promise.all(baskets.map((b) => toBasketView(b, config ?? null)));
    },
    enabled: config !== undefined,
  });
}
