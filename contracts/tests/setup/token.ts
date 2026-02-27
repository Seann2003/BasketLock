import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { LiteSVMProvider } from "anchor-litesvm";
import { LiteSVM } from "litesvm";

export async function createTestMint(
  provider: LiteSVMProvider,
  mintAuthority: PublicKey,
  decimals: number = 6
): Promise<PublicKey> {
  const mintKeypair = Keypair.generate();

  const lamports = await provider.connection.getMinimumBalanceForRentExemption(
    MINT_SIZE
  );

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      mintAuthority,
      null, // freeze authority
      TOKEN_PROGRAM_ID
    )
  );

  await provider.sendAndConfirm?.(tx, [mintKeypair]);

  return mintKeypair.publicKey;
}

export async function createTestAta(
  provider: LiteSVMProvider,
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const ata = await getAssociatedTokenAddress(mint, owner);

  const tx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      provider.wallet.publicKey,
      ata,
      owner,
      mint
    )
  );

  await provider.sendAndConfirm?.(tx, []);

  return ata;
}

export async function mintTestTokens(
  provider: LiteSVMProvider,
  mint: PublicKey,
  destination: PublicKey,
  authority: Keypair,
  amount: number | bigint
): Promise<void> {
  const tx = new Transaction().add(
    createMintToInstruction(
      mint,
      destination,
      authority.publicKey,
      amount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  await provider.sendAndConfirm?.(tx, [authority]);
}

export async function getTestAtaAddress(
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  return getAssociatedTokenAddress(mint, owner);
}

export async function getTokenBalance(
  provider: LiteSVMProvider,
  tokenAccount: PublicKey
): Promise<bigint> {
  const account = await getAccount(provider.connection, tokenAccount);
  return account.amount;
}
