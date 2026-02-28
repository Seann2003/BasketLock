"use client";

import { createContext, type ReactNode } from "react";

type SolanaChain = `solana:${string}`;

type ChainContextValue = {
  chain: SolanaChain;
  rpcUrl: string;
};

export const ChainContext = createContext<ChainContextValue>({
  chain: "solana:devnet",
  rpcUrl: "",
});

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const chain = (process.env.NEXT_PUBLIC_SOLANA_CHAIN ?? "solana:devnet") as SolanaChain;

export function ChainProvider({ children }: { children: ReactNode }) {
  return (
    <ChainContext.Provider value={{ chain, rpcUrl }}>
      {children}
    </ChainContext.Provider>
  );
}
