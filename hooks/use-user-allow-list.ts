"use client";

import type { Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import { fetchUserAllowList } from "@/lib/solana/accounts";
import { useRpc } from "./use-rpc";

export function useUserAllowList(
  basketAddress: Address | undefined,
  userAddress: Address | undefined,
) {
  const { rpc } = useRpc();

  return useQuery({
    queryKey: ["basketlock", "user-allow-list", basketAddress, userAddress],
    queryFn: () => fetchUserAllowList(rpc, basketAddress!, userAddress!),
    enabled: !!basketAddress && !!userAddress,
  });
}
