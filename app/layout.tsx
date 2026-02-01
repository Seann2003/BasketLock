import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
