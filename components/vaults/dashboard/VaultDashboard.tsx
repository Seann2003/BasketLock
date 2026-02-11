"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VaultFilters } from "./VaultFilters";
import { VaultGrid } from "./VaultGrid";
import type { Vault, VaultStatus } from "../types";

interface VaultDashboardProps {
  vaults: Vault[];
  title?: string;
  description?: string;
  onViewVault?: (vault: Vault) => void;
  onManageVault?: (vault: Vault) => void;
  onTransferVault?: (vault: Vault) => void;
}

export function VaultDashboard({
  vaults,
  title = "My Vaults",
  description = "Manage and track all your token vaults",
  onViewVault,
  onManageVault,
  onTransferVault,
}: VaultDashboardProps) {
  const [activeFilter, setActiveFilter] = React.useState<VaultStatus | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  const vaultCount = React.useMemo(() => {
    return {
      all: vaults.length,
      active: vaults.filter((v) => v.status === "active").length,
      locked: vaults.filter((v) => v.status === "locked").length,
      completed: vaults.filter((v) => v.status === "completed").length,
    };
  }, [vaults]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <VaultFilters
            activeFilter={activeFilter}
            searchQuery={searchQuery}
            vaultCount={vaultCount}
            onFilterChange={setActiveFilter}
            onSearchChange={setSearchQuery}
          />

          <VaultGrid
            vaults={vaults}
            filter={activeFilter}
            searchQuery={searchQuery}
            onView={onViewVault}
            onManage={onManageVault}
            onTransfer={onTransferVault}
          />
        </CardContent>
      </Card>
    </div>
  );
}
