"use client";

import Link from "next/link";
import { Eye, Coins, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BasketView } from "@/lib/types";

interface VaultCardProps {
  basket: BasketView;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function VaultCard({ basket }: VaultCardProps) {
  return (
    <Card className="group relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-sm">{basket.name}</CardTitle>
            <CardDescription className="line-clamp-1">
              Basket #{basket.basketId.toString()}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {basket.effectiveFeeBps / 100}% fee
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Coins className="h-3 w-3" />
              Tokens
            </span>
            <span className="font-medium">{basket.tokenCount}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Owner
            </span>
            <span className="font-mono text-xs">
              {truncateAddress(basket.owner)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Link href={`/vaults/${basket.basketId.toString()}`} className="w-full">
          <Button variant="ghost" size="sm" className="w-full gap-1 text-xs">
            <Eye className="h-3.5 w-3.5" />
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
