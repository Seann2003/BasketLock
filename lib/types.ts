import type { Address } from "@solana/kit";
import type { ParsedBasket, ParsedBasketToken, ParsedConfig } from "./solana/types";
import { getBasketPda } from "./solana/pdas";

export type BasketView = ParsedBasket & {
  address: Address;
  effectiveFeeBps: number;
};

export type BasketTokenView = ParsedBasketToken & {
  vaultBalance?: bigint;
};

export async function toBasketView(
  basket: ParsedBasket,
  config: ParsedConfig | null,
): Promise<BasketView> {
  const [address] = await getBasketPda(basket.basketId);
  const effectiveFeeBps = basket.feeBpsOverride ?? config?.feeBps ?? 0;
  return { ...basket, address, effectiveFeeBps };
}

export function toBasketTokenView(
  token: ParsedBasketToken,
  vaultBalance?: bigint,
): BasketTokenView {
  return { ...token, vaultBalance };
}
