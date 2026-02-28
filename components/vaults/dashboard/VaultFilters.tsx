"use client";

import { SearchInput } from "@/components/ui/search-input";

interface VaultFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showMyBaskets: boolean;
  onMyBasketsChange: (show: boolean) => void;
  isConnected: boolean;
}

export function VaultFilters({
  searchQuery,
  onSearchChange,
  showMyBaskets,
  onMyBasketsChange,
  isConnected,
}: VaultFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput
        placeholder="Search baskets..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full sm:w-64"
      />
      {isConnected && (
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showMyBaskets}
            onChange={(e) => onMyBasketsChange(e.target.checked)}
            className="accent-primary"
          />
          My Baskets
        </label>
      )}
    </div>
  );
}
