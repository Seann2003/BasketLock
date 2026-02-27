import {
  type Address,
  type Instruction,
  AccountRole,
} from "@solana/kit";
import {
  PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  IX_DISCRIMINATORS,
} from "../constants";
import {
  getConfigPda,
  getBasketTokenPda,
  getFeeVaultPda,
  getEventAuthorityPda,
  getAssociatedTokenAddress,
} from "../pdas";

export async function buildAddTokensIx(
  payer: Address,
  basketAddress: Address,
  underlyingMint: Address,
  vaultAuthority: Address,
  tokenProgram: Address,
): Promise<Instruction> {
  const [configAddress] = await getConfigPda();
  const [basketTokenAddress] = await getBasketTokenPda(basketAddress, underlyingMint);
  const [feeVaultAddress] = await getFeeVaultPda(basketAddress, underlyingMint);
  const [vaultAta] = await getAssociatedTokenAddress(vaultAuthority, tokenProgram, underlyingMint);
  const [eventAuthority] = await getEventAuthorityPda();

  return {
    programAddress: PROGRAM_ID,
    accounts: [
      { address: payer, role: AccountRole.WRITABLE_SIGNER },
      { address: configAddress, role: AccountRole.READONLY },
      { address: basketAddress, role: AccountRole.WRITABLE },
      { address: underlyingMint, role: AccountRole.READONLY },
      { address: vaultAuthority, role: AccountRole.READONLY },
      { address: basketTokenAddress, role: AccountRole.WRITABLE },
      { address: vaultAta, role: AccountRole.WRITABLE },
      { address: feeVaultAddress, role: AccountRole.WRITABLE },
      { address: tokenProgram, role: AccountRole.READONLY },
      { address: ASSOCIATED_TOKEN_PROGRAM_ID, role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
      { address: eventAuthority, role: AccountRole.READONLY },
      { address: PROGRAM_ID, role: AccountRole.READONLY },
    ],
    data: new Uint8Array([...IX_DISCRIMINATORS.addTokens]),
  };
}
