"use client";

import type { Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import { useRpc } from "./use-rpc";
import { getAssociatedTokenAddress } from "@/lib/solana/pdas";
import { TOKEN_PROGRAM_ID } from "@/lib/solana/constants";

export function useTokenBalance(
  owner: Address | undefined,
  mint: Address | undefined,
) {
  const { rpc } = useRpc();

  return useQuery({
    queryKey: ["basketlock", "token-balance", owner, mint],
    queryFn: async () => {
      const [ata] = await getAssociatedTokenAddress(owner!, TOKEN_PROGRAM_ID, mint!);
      try {
        const resp = await rpc.getTokenAccountBalance(ata).send();
        return BigInt(resp.value.amount);
      } catch {
        return BigInt(0);
      }
    },
    enabled: !!owner && !!mint,
  });
}
