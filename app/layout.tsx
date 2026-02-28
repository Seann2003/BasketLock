import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "BasketLock - Token Vesting & Vault Management",
  description:
    "Create and manage multi-token vesting vaults with NFT governance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
