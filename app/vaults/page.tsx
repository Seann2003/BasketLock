"use client";

import { VaultDashboard } from "@/components/vaults";
import { mockVaults } from "@/components/vaults";

export default function VaultsPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <VaultDashboard
        vaults={mockVaults}
        onViewVault={(vault) => console.log("View vault:", vault.id)}
        onManageVault={(vault) => console.log("Manage vault:", vault.id)}
        onTransferVault={(vault) => console.log("Transfer vault:", vault.id)}
      />
    </main>
  );
}
