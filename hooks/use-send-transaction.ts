"use client";

import { useCallback } from "react";
import {
  type Instruction,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signAndSendTransactionMessageWithSigners,
} from "@solana/kit";
import { useWalletAccountTransactionSendingSigner } from "@solana/react";
import type { UiWalletAccount } from "@wallet-standard/react";
import { useRpc } from "./use-rpc";
import { useChain } from "./use-chain";

export function useSendTransaction(account: UiWalletAccount) {
  const { rpc } = useRpc();
  const { chain } = useChain();
  const signer = useWalletAccountTransactionSendingSigner(account, chain);

  const sendTransaction = useCallback(
    async (instructions: Instruction[]) => {
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

      const message = pipe(
        createTransactionMessage({ version: 0 }),
        (m) => setTransactionMessageFeePayerSigner(signer, m),
        (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        (m) => appendTransactionMessageInstructions(instructions, m),
      );

      return signAndSendTransactionMessageWithSigners(message);
    },
    [rpc, signer],
  );

  return { sendTransaction };
}
