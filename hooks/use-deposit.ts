"use client";

import type { Address } from "@solana/kit";
import type { UiWalletAccount } from "@wallet-standard/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildDepositMultiIx } from "@/lib/solana/instructions";
import { TOKEN_PROGRAM_ID } from "@/lib/solana/constants";
import { useSendTransaction } from "./use-send-transaction";
import { useUserAllowList } from "./use-user-allow-list";
import { getUserAllowListPda } from "@/lib/solana/pdas";

type DepositParams = {
  basketAddress: Address;
  basketId: bigint;
  shareMint: Address;
  vaultAuthority: Address;
  amounts: bigint[];
  tokenMints: Address[];
};

export function useDeposit(
  account: UiWalletAccount,
  basketAddress: Address | undefined,
) {
  const { sendTransaction } = useSendTransaction(account);
  const publicKey = account.address as Address;
  const queryClient = useQueryClient();
  const { data: allowList } = useUserAllowList(basketAddress, publicKey);

  return useMutation({
    mutationFn: async (params: DepositParams) => {
      let userAllowListAddr: Address | null = null;
      if (allowList) {
        const [addr] = await getUserAllowListPda(params.basketAddress, publicKey);
        userAllowListAddr = addr;
      }

      const ix = await buildDepositMultiIx(
        publicKey,
        params.basketAddress,
        params.basketId,
        params.shareMint,
        params.amounts,
        params.tokenMints,
        params.vaultAuthority,
        TOKEN_PROGRAM_ID,
        userAllowListAddr,
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
