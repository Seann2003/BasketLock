"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchConfig } from "@/lib/solana/accounts";
import { useRpc } from "./use-rpc";

export function useConfig() {
  const { rpc } = useRpc();
  return useQuery({
    queryKey: ["basketlock", "config"],
    queryFn: () => fetchConfig(rpc),
  });
}
