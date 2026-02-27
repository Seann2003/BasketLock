import { fromWorkspace, LiteSVMProvider } from "anchor-litesvm";
import { Program, Wallet, BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { LiteSVM } from "litesvm";

import type { Contracts } from "../../target/types/contracts";
const IDL = require("../../target/idl/contracts.json");

export interface TestContext {
  svm: LiteSVM;
  provider: LiteSVMProvider;
  program: Program<Contracts>;
  admin: Keypair;
}
export function createTestContext(): TestContext {
  const svm = fromWorkspace(".");
  const admin = Keypair.generate();

  // Fund admin — generous amount, these aren't real funds
  svm.airdrop(admin.publicKey, BigInt(100 * LAMPORTS_PER_SOL));

  const provider = new LiteSVMProvider(svm, new Wallet(admin));
  const program = new Program<Contracts>(IDL, provider);

  return { svm, provider, program, admin };
}

export function fundAccount(
  svm: LiteSVM,
  pubkey: PublicKey,
  lamports: number = 10 * LAMPORTS_PER_SOL
): void {
  svm.airdrop(pubkey, BigInt(lamports));
}
