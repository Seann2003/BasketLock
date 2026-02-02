import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Lock, Wallet, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <main className="flex-1 flex items-center justify-center overflow-hidden">
        <section className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Secure Token Vesting
                <span className="text-primary"> Made Simple</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground text-base">
                Create multi-token baskets with customizable vesting schedules,
                multisig governance, and NFT-based ownership.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/vaults">
                <Button size="lg" className="gap-2">
                  View My Vaults
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/create">
                <Button variant="outline" size="lg">
                  Create Vault
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8 w-full max-w-5xl">
              <Card className="flex flex-col items-center text-center transition-all hover:ring-primary/20 hover:shadow-md">
                <CardHeader className="flex flex-col items-center gap-3 w-full">
                  <div className="rounded-full bg-primary/10 p-3 mb-1">
                    <Lock className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    Token Locking
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Lock multiple tokens with custom vesting schedules including
                    cliffs, duration, and frequency options.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="flex flex-col items-center text-center transition-all hover:ring-primary/20 hover:shadow-md">
                <CardHeader className="flex flex-col items-center gap-3 w-full">
                  <div className="rounded-full bg-primary/10 p-3 mb-1">
                    <Shield className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    Multisig Security
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Configure multisig governance with customizable threshold
                    and signer management.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="flex flex-col items-center text-center transition-all hover:ring-primary/20 hover:shadow-md">
                <CardHeader className="flex flex-col items-center gap-3 w-full">
                  <div className="rounded-full bg-primary/10 p-3 mb-1">
                    <Wallet className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    NFT Ownership
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Each vault is represented as an NFT that can be transferred,
                    traded, or used as collateral.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-3">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs text-muted-foreground">
            BasketLock - Secure Token Vesting Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
