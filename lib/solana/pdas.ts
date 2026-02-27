import {
  type Address,
  getProgramDerivedAddress,
  getAddressEncoder,
  type ProgramDerivedAddress,
} from "@solana/kit";
import {
  PROGRAM_ID,
  CONFIG_SEED,
  BASKET_SEED,
  BASKET_TOKEN_SEED,
  VAULT_AUTHORITY_SEED,
  MINT_AUTHORITY_SEED,
  FEE_VAULT_SEED,
  USER_ALLOW_SEED,
  EVENT_AUTHORITY_SEED,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "./constants";

const addressEncoder = getAddressEncoder();

function u64LE(value: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  const view = new DataView(buf.buffer);
  view.setBigUint64(0, value, true);
  return buf;
}

export function getConfigPda(): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [CONFIG_SEED],
  });
}

export function getBasketPda(
  basketId: bigint,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [BASKET_SEED, u64LE(basketId)],
  });
}

export function getVaultAuthorityPda(
  basketId: bigint,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [VAULT_AUTHORITY_SEED, u64LE(basketId)],
  });
}

export function getMintAuthorityPda(
  basketId: bigint,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [MINT_AUTHORITY_SEED, u64LE(basketId)],
  });
}

export function getBasketTokenPda(
  basket: Address,
  mint: Address,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [BASKET_TOKEN_SEED, addressEncoder.encode(basket), addressEncoder.encode(mint)],
  });
}

export function getFeeVaultPda(
  basket: Address,
  mint: Address,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [FEE_VAULT_SEED, addressEncoder.encode(basket), addressEncoder.encode(mint)],
  });
}

export function getUserAllowListPda(
  basket: Address,
  user: Address,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [USER_ALLOW_SEED, addressEncoder.encode(basket), addressEncoder.encode(user)],
  });
}

export function getEventAuthorityPda(): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [EVENT_AUTHORITY_SEED],
  });
}

export function getAssociatedTokenAddress(
  wallet: Address,
  tokenProgram: Address,
  mint: Address,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: ASSOCIATED_TOKEN_PROGRAM_ID,
    seeds: [
      addressEncoder.encode(wallet),
      addressEncoder.encode(tokenProgram),
      addressEncoder.encode(mint),
    ],
  });
}
