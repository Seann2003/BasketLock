"use client";

import * as React from "react";

import { SearchInput } from "@/components/ui/search-input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { VaultStatus } from "../types";

interface VaultFiltersProps {
  activeFilter: VaultStatus | "all";
  searchQuery: string;
  vaultCount: {
    all: number;
    active: number;
    locked: number;
    completed: number;
  };
  onFilterChange: (filter: VaultStatus | "all") => void;
  onSearchChange: (query: string) => void;
}

export function VaultFilters({
  activeFilter,
  searchQuery,
  vaultCount,
  onFilterChange,
  onSearchChange,
}: VaultFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs
        value={activeFilter}
        onValueChange={(value) => onFilterChange(value as VaultStatus | "all")}
        className="w-full sm:w-auto"
      >
        <TabsList className="h-9 w-full sm:w-auto">
          <TabsTrigger value="all" className="gap-1.5">
            All
            <span className="text-muted-foreground">({vaultCount.all})</span>
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1.5">
            Active
            <span className="text-muted-foreground">({vaultCount.active})</span>
          </TabsTrigger>
          <TabsTrigger value="locked" className="gap-1.5">
            Locked
            <span className="text-muted-foreground">({vaultCount.locked})</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">
            Completed
            <span className="text-muted-foreground">
              ({vaultCount.completed})
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <SearchInput
        placeholder="Search vaults..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full sm:w-64"
      />
    </div>
  );
}
