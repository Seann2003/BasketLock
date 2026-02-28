"use client";

import { useContext } from "react";
import { RpcContext } from "@/components/providers/rpc-provider";

export function useRpc() {
  const ctx = useContext(RpcContext);
  if (!ctx) {
    throw new Error("useRpc must be used within RpcProvider");
  }
  return ctx;
}
