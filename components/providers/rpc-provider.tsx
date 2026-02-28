"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { ChainContext } from "./chain-provider";

type RpcContextValue = {
  rpc: ReturnType<typeof createSolanaRpc>;
  rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
};

export const RpcContext = createContext<RpcContextValue | null>(null);

export function RpcProvider({ children }: { children: ReactNode }) {
  const { rpcUrl } = useContext(ChainContext);

  const value = useMemo(() => {
    const rpc = createSolanaRpc(rpcUrl);
    const wsUrl = rpcUrl.replace("https", "wss");
    const rpcSubscriptions = createSolanaRpcSubscriptions(wsUrl);
    return { rpc, rpcSubscriptions };
  }, [rpcUrl]);

  return <RpcContext.Provider value={value}>{children}</RpcContext.Provider>;
}
