"use client";

import type { Address } from "@solana/kit";
import type { UiWalletAccount } from "@wallet-standard/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildWithdrawMultiIx } from "@/lib/solana/instructions";
import { TOKEN_PROGRAM_ID } from "@/lib/solana/constants";
import { useSendTransaction } from "./use-send-transaction";

type WithdrawParams = {
  basketAddress: Address;
  shareMint: Address;
  vaultAuthority: Address;
  sharesToBurn: bigint;
  tokenMints: Address[];
};

export function useWithdraw(account: UiWalletAccount) {
  const { sendTransaction } = useSendTransaction(account);
  const publicKey = account.address as Address;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: WithdrawParams) => {
      const ix = await buildWithdrawMultiIx(
        publicKey,
        params.basketAddress,
        params.shareMint,
        params.vaultAuthority,
        params.sharesToBurn,
        params.tokenMints,
        TOKEN_PROGRAM_ID,
      );

      return sendTransaction([ix]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["basketlock", "basket-tokens"] });
      queryClient.invalidateQueries({ queryKey: ["basketlock", "share-balance"] });
      queryClient.invalidateQueries({ queryKey: ["basketlock", "token-balance"] });
    },
  });
}
