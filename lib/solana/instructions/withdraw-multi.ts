import {
  type Address,
  type IInstruction,
  AccountRole,
  getU64Codec,
} from "@solana/kit";
import {
  PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  IX_DISCRIMINATORS,
} from "../constants";
import {
  getConfigPda,
  getBasketTokenPda,
  getEventAuthorityPda,
  getAssociatedTokenAddress,
} from "../pdas";

export async function buildWithdrawMultiIx(
  payer: Address,
  basketAddress: Address,
  shareMint: Address,
  vaultAuthority: Address,
  sharesToBurn: bigint,
  tokenMints: Address[],
  tokenProgram: Address,
): Promise<IInstruction> {
  const [configAddress] = await getConfigPda();
  const [userShareAta] = await getAssociatedTokenAddress(payer, tokenProgram, shareMint);
  const [eventAuthority] = await getEventAuthorityPda();

  const u64 = getU64Codec();
  const data = new Uint8Array([...IX_DISCRIMINATORS.withdrawMulti, ...u64.encode(sharesToBurn)]);

  const accounts: { address: Address; role: AccountRole }[] = [
    { address: payer, role: AccountRole.WRITABLE_SIGNER },
    { address: configAddress, role: AccountRole.READONLY },
    { address: basketAddress, role: AccountRole.READONLY },
    { address: shareMint, role: AccountRole.WRITABLE },
    { address: userShareAta, role: AccountRole.WRITABLE },
    { address: vaultAuthority, role: AccountRole.READONLY },
    { address: tokenProgram, role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: eventAuthority, role: AccountRole.READONLY },
    { address: PROGRAM_ID, role: AccountRole.READONLY },
  ];

  for (let i = 0; i < tokenMints.length; i++) {
    const mint = tokenMints[i];
    const [basketTokenPda] = await getBasketTokenPda(basketAddress, mint);
    const [vaultAta] = await getAssociatedTokenAddress(vaultAuthority, tokenProgram, mint);
    const [userAta] = await getAssociatedTokenAddress(payer, tokenProgram, mint);

    accounts.push(
      { address: basketTokenPda, role: AccountRole.READONLY },
      { address: mint, role: AccountRole.READONLY },
      { address: vaultAta, role: AccountRole.WRITABLE },
      { address: userAta, role: AccountRole.WRITABLE },
    );
  }

  return {
    programAddress: PROGRAM_ID,
    accounts,
    data,
  };
}
