"use client";

import { format } from "date-fns";
import { MoreHorizontal, Eye, Settings, ArrowRightLeft } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Vault } from "../types";

interface VaultCardProps {
  vault: Vault;
  onView?: (vault: Vault) => void;
  onManage?: (vault: Vault) => void;
  onTransfer?: (vault: Vault) => void;
}

function getStatusBadgeVariant(status: Vault["status"]) {
  switch (status) {
    case "active":
      return "success";
    case "locked":
      return "default";
    case "completed":
      return "secondary";
    default:
      return "outline";
  }
}

function getStatusLabel(status: Vault["status"]) {
  switch (status) {
    case "active":
      return "Active";
    case "locked":
      return "Locked";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

function calculateProgress(vestingSchedule: Vault["vestingSchedule"]): number {
  const now = new Date();
  const total =
    vestingSchedule.endDate.getTime() - vestingSchedule.startDate.getTime();
  const elapsed = now.getTime() - vestingSchedule.startDate.getTime();

  if (elapsed <= 0) return 0;
  if (elapsed >= total) return 100;

  return Math.round((elapsed / total) * 100);
}

export function VaultCard({ vault, onView, onManage, onTransfer }: VaultCardProps) {
  const progress = calculateProgress(vault.vestingSchedule);

  return (
    <Card className="group relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-sm">{vault.name}</CardTitle>
            <CardDescription className="line-clamp-1">
              {vault.description}
            </CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(vault.status)}>
            {getStatusLabel(vault.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total Value</span>
            <span className="font-medium">
              ${vault.totalValueUSD.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Vesting Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Start: {format(vault.vestingSchedule.startDate, "MMM d, yyyy")}</span>
              <span>End: {format(vault.vestingSchedule.endDate, "MMM d, yyyy")}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tokens</span>
            <span className="font-medium">{vault.tokens.length}</span>
          </div>

          {vault.isMultisig && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Multisig</span>
              <span className="font-medium">
                {vault.threshold} of {vault.signers?.length || 0}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="justify-between border-t pt-4">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => onView?.(vault)}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => onManage?.(vault)}
          >
            <Settings className="h-3.5 w-3.5" />
            Manage
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => onTransfer?.(vault)}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Transfer
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView?.(vault)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onManage?.(vault)}>
              Manage Vault
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTransfer?.(vault)}>
              Transfer NFT
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Revoke Access
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
