import {
  type Address,
  type Instruction,
  AccountRole,
  getU64Codec,
  getU16Codec,
} from "@solana/kit";
import { PROGRAM_ID, SYSTEM_PROGRAM_ID, IX_DISCRIMINATORS, MAX_NAME_LEN } from "../constants";
import {
  getConfigPda,
  getBasketPda,
  getVaultAuthorityPda,
  getMintAuthorityPda,
  getEventAuthorityPda,
} from "../pdas";

function encodeOption16(value: number | null): Uint8Array {
  if (value === null) return new Uint8Array([0]);
  const u16 = getU16Codec();
  return new Uint8Array([1, ...u16.encode(value)]);
}

function encodeName(name: string): Uint8Array {
  const buf = new Uint8Array(MAX_NAME_LEN);
  const encoded = new TextEncoder().encode(name.slice(0, MAX_NAME_LEN));
  buf.set(encoded);
  return buf;
}

export async function buildCreateBasketIx(
  payer: Address,
  basketId: bigint,
  name: string,
  shareMintAddress: Address,
  tokenProgram: Address,
  feeBpsOverride: number | null = null,
): Promise<Instruction> {
  const [configAddress] = await getConfigPda();
  const [basketAddress] = await getBasketPda(basketId);
  const [vaultAuthority] = await getVaultAuthorityPda(basketId);
  const [mintAuthority] = await getMintAuthorityPda(basketId);
  const [eventAuthority] = await getEventAuthorityPda();

  const u64 = getU64Codec();
  const data = new Uint8Array([
    ...IX_DISCRIMINATORS.createBasket,
    ...u64.encode(basketId),
    ...encodeName(name),
    ...encodeOption16(feeBpsOverride),
  ]);

  return {
    programAddress: PROGRAM_ID,
    accounts: [
      { address: payer, role: AccountRole.WRITABLE_SIGNER },
      { address: configAddress, role: AccountRole.READONLY },
      { address: basketAddress, role: AccountRole.WRITABLE },
      { address: vaultAuthority, role: AccountRole.READONLY },
      { address: mintAuthority, role: AccountRole.READONLY },
      { address: shareMintAddress, role: AccountRole.WRITABLE_SIGNER },
      { address: tokenProgram, role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
      { address: eventAuthority, role: AccountRole.READONLY },
      { address: PROGRAM_ID, role: AccountRole.READONLY },
    ],
    data,
  };
}
