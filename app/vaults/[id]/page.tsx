"use client";

import { use } from "react";
import { BasketDetail } from "@/components/vaults/detail/basket-detail";

export default function BasketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const basketId = BigInt(id);

  return (
    <main className="container mx-auto py-8 px-4">
      <BasketDetail basketId={basketId} />
    </main>
  );
}
