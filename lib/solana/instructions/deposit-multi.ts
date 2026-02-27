import {
  type Address,
  type Instruction,
  AccountRole,
  getU64Codec,
  getU32Codec,
} from "@solana/kit";
import {
  PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  IX_DISCRIMINATORS,
} from "../constants";
import {
  getConfigPda,
  getMintAuthorityPda,
  getBasketTokenPda,
  getFeeVaultPda,
  getEventAuthorityPda,
  getAssociatedTokenAddress,
} from "../pdas";

export async function buildDepositMultiIx(
  payer: Address,
  basketAddress: Address,
  basketId: bigint,
  shareMint: Address,
  amounts: bigint[],
  tokenMints: Address[],
  vaultAuthority: Address,
  tokenProgram: Address,
  userAllowList: Address | null = null,
): Promise<Instruction> {
  const [configAddress] = await getConfigPda();
  const [mintAuthority] = await getMintAuthorityPda(basketId);
  const [userShareAta] = await getAssociatedTokenAddress(payer, tokenProgram, shareMint);
  const [eventAuthority] = await getEventAuthorityPda();

  const u64 = getU64Codec();
  const u32 = getU32Codec();
  const amountsData = new Uint8Array([
    ...u32.encode(amounts.length),
    ...amounts.flatMap((a) => [...u64.encode(a)]),
  ]);

  const data = new Uint8Array([...IX_DISCRIMINATORS.depositMulti, ...amountsData]);

  const accounts: { address: Address; role: AccountRole }[] = [
    { address: payer, role: AccountRole.WRITABLE_SIGNER },
    { address: configAddress, role: AccountRole.READONLY },
    { address: basketAddress, role: AccountRole.READONLY },
    { address: mintAuthority, role: AccountRole.READONLY },
    { address: shareMint, role: AccountRole.WRITABLE },
    { address: userShareAta, role: AccountRole.WRITABLE },
  ];

  if (userAllowList) {
    accounts.push({ address: userAllowList, role: AccountRole.READONLY });
  }

  accounts.push(
    { address: tokenProgram, role: AccountRole.READONLY },
    { address: ASSOCIATED_TOKEN_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: eventAuthority, role: AccountRole.READONLY },
    { address: PROGRAM_ID, role: AccountRole.READONLY },
  );

  for (let i = 0; i < tokenMints.length; i++) {
    const mint = tokenMints[i];
    const [basketTokenPda] = await getBasketTokenPda(basketAddress, mint);
    const [userAta] = await getAssociatedTokenAddress(payer, tokenProgram, mint);
    const [vaultAta] = await getAssociatedTokenAddress(vaultAuthority, tokenProgram, mint);
    const [feeVault] = await getFeeVaultPda(basketAddress, mint);

    accounts.push(
      { address: basketTokenPda, role: AccountRole.READONLY },
      { address: mint, role: AccountRole.READONLY },
      { address: userAta, role: AccountRole.WRITABLE },
      { address: vaultAta, role: AccountRole.WRITABLE },
      { address: feeVault, role: AccountRole.WRITABLE },
    );
  }

  return {
    programAddress: PROGRAM_ID,
    accounts,
    data,
  };
}
