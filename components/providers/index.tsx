"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ChainProvider } from "./chain-provider";
import { WalletProvider } from "./wallet-provider";
import { RpcProvider } from "./rpc-provider";
import { QueryProvider } from "./query-provider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ChainProvider>
        <WalletProvider>
          <RpcProvider>
            <QueryProvider>
              {children}
              <Toaster richColors />
            </QueryProvider>
          </RpcProvider>
        </WalletProvider>
      </ChainProvider>
    </ThemeProvider>
  );
}
