"use client";

import { useContext } from "react";
import { ChainContext } from "@/components/providers/chain-provider";

export function useChain() {
  return useContext(ChainContext);
}
