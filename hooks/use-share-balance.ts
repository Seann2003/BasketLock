"use client";

import type { Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import { useRpc } from "./use-rpc";
import { useWalletAccount } from "./use-wallet-account";
import { getAssociatedTokenAddress } from "@/lib/solana/pdas";
import { TOKEN_PROGRAM_ID } from "@/lib/solana/constants";

export function useShareBalance(shareMint: Address | undefined) {
  const { rpc } = useRpc();
  const { publicKey } = useWalletAccount();

  return useQuery({
    queryKey: ["basketlock", "share-balance", publicKey, shareMint],
    queryFn: async () => {
      const [ata] = await getAssociatedTokenAddress(publicKey!, TOKEN_PROGRAM_ID, shareMint!);
      try {
        const resp = await rpc.getTokenAccountBalance(ata).send();
        return BigInt(resp.value.amount);
      } catch {
        return BigInt(0);
      }
    },
    enabled: !!publicKey && !!shareMint,
  });
}
