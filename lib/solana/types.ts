import type { Address } from "@solana/kit";
import {
  configCodec,
  basketCodec,
  basketTokenCodec,
  userAllowListCodec,
  decodeAccount,
} from "./codecs";

export type ParsedConfig = {
  admin: Address;
  whitelistAuth: Address;
  feeBps: number;
  complianceEnabled: boolean;
  version: number;
  bump: number;
};

export type ParsedBasket = {
  owner: Address;
  shareMint: Address;
  vaultAuthority: Address;
  basketId: bigint;
  name: string;
  feeBpsOverride: number | null;
  tokenCount: number;
  version: number;
  basketBump: number;
  vaultAuthorityBump: number;
  mintAuthorityBump: number;
};

export type ParsedBasketToken = {
  basket: Address;
  mint: Address;
  vaultAta: Address;
  feeVaultAta: Address;
  decimals: number;
  enabled: boolean;
  bump: number;
};

export type ParsedUserAllowList = {
  basket: Address;
  user: Address;
  allowed: boolean;
  bump: number;
};

export function parseConfig(data: Uint8Array): ParsedConfig {
  const raw = decodeAccount(configCodec, data);
  return {
    admin: raw.admin,
    whitelistAuth: raw.whitelistAuth,
    feeBps: raw.feeBps,
    complianceEnabled: raw.complianceEnabled,
    version: raw.version,
    bump: raw.bump,
  };
}

export function parseBasket(data: Uint8Array): ParsedBasket {
  const raw = decodeAccount(basketCodec, data);
  const nameBytes = raw.name instanceof Uint8Array ? raw.name : new Uint8Array(raw.name);
  const nullIdx = nameBytes.indexOf(0);
  const name = new TextDecoder().decode(
    nullIdx === -1 ? nameBytes : nameBytes.slice(0, nullIdx),
  );
  return {
    owner: raw.owner,
    shareMint: raw.shareMint,
    vaultAuthority: raw.vaultAuthority,
    basketId: raw.basketId,
    name,
    feeBpsOverride: raw.hasFeeOverride === 1 ? raw.feeBpsOverride : null,
    tokenCount: raw.tokenCount,
    version: raw.version,
    basketBump: raw.basketBump,
    vaultAuthorityBump: raw.vaultAuthorityBump,
    mintAuthorityBump: raw.mintAuthorityBump,
  };
}

export function parseBasketToken(data: Uint8Array): ParsedBasketToken {
  const raw = decodeAccount(basketTokenCodec, data);
  return {
    basket: raw.basket,
    mint: raw.mint,
    vaultAta: raw.vaultAta,
    feeVaultAta: raw.feeVaultAta,
    decimals: raw.decimals,
    enabled: raw.enabled,
    bump: raw.bump,
  };
}

export function parseUserAllowList(data: Uint8Array): ParsedUserAllowList {
  const raw = decodeAccount(userAllowListCodec, data);
  return {
    basket: raw.basket,
    user: raw.user,
    allowed: raw.allowed,
    bump: raw.bump,
  };
}
