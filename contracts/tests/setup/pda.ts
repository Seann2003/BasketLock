import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export const PROGRAM_ID = new PublicKey(
  "2rQ6Auaeqovph67yWxhFpuhitrJJkGU3jrZwUUSYJKs6"
);

const CONFIG_SEED = Buffer.from("config");
const BASKET_SEED = Buffer.from("basket");
const BASKET_TOKEN_SEED = Buffer.from("basket_token");
const VAULT_AUTHORITY_SEED = Buffer.from("vault_authority");
const MINT_AUTHORITY_SEED = Buffer.from("mint_authority");
const FEE_VAULT_SEED = Buffer.from("fee_vault");
const USER_ALLOW_SEED = Buffer.from("user_allow");

function u64ToLeBytes(value: BN | number): Buffer {
  const bn = new BN(value);
  return bn.toArrayLike(Buffer, "le", 8);
}


export function findConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);
}

export function findBasketPda(basketId: BN | number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [BASKET_SEED, u64ToLeBytes(basketId)],
    PROGRAM_ID
  );
}

export function findVaultAuthorityPda(
  basketId: BN | number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [VAULT_AUTHORITY_SEED, u64ToLeBytes(basketId)],
    PROGRAM_ID
  );
}

export function findMintAuthorityPda(
  basketId: BN | number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [MINT_AUTHORITY_SEED, u64ToLeBytes(basketId)],
    PROGRAM_ID
  );
}

export function findBasketTokenPda(
  basket: PublicKey,
  mint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [BASKET_TOKEN_SEED, basket.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  );
}

export function findFeeVaultPda(
  basket: PublicKey,
  mint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [FEE_VAULT_SEED, basket.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  );
}

export function findUserAllowListPda(
  basket: PublicKey,
  user: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [USER_ALLOW_SEED, basket.toBuffer(), user.toBuffer()],
    PROGRAM_ID
  );
}
