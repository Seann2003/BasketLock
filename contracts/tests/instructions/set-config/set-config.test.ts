import { expect } from "chai";
import { Keypair } from "@solana/web3.js";
import {
  createTestContext,
  fundAccount,
  findConfigPda,
  type TestContext,
} from "../../setup";

describe("set_config", () => {
  let ctx: TestContext;
  const whitelistAuth = Keypair.generate();

  beforeEach(async () => {
    ctx = createTestContext();
    await ctx.program.methods
      .initConfig(20, whitelistAuth.publicKey, false)
      .accounts({ program: ctx.program.programId })
      .rpc();
  });

  it("updates fee_bps", async () => {
    await ctx.program.methods
      .setConfig(40, null, null, null)
      .accounts({ program: ctx.program.programId })
      .rpc();

    const [configPda] = findConfigPda();
    const config = await ctx.program.account.config.fetch(configPda);
    expect(config.feeBps).to.equal(40);
  });

  it("updates compliance_enabled flag", async () => {
    await ctx.program.methods
      .setConfig(null, null, true, null)
      .accounts({ program: ctx.program.programId })
      .rpc();

    const [configPda] = findConfigPda();
    const config = await ctx.program.account.config.fetch(configPda);
    expect(config.complianceEnabled).to.equal(true);
  });

  it("transfers admin to new keypair", async () => {
    const newAdmin = Keypair.generate();
    await ctx.program.methods
      .setConfig(null, null, null, newAdmin.publicKey)
      .accounts({ program: ctx.program.programId })
      .rpc();

    const [configPda] = findConfigPda();
    const config = await ctx.program.account.config.fetch(configPda);
    expect(config.admin.toBase58()).to.equal(newAdmin.publicKey.toBase58());
  });

  it("rejects non-admin caller", async () => {
    const impostor = Keypair.generate();
    fundAccount(ctx.svm, impostor.publicKey);

    try {
      // Build with impostor as signer — config.admin won't match
      await ctx.program.methods
        .setConfig(30, null, null, null)
        .accounts({ program: ctx.program.programId })
        .signers([impostor])
        .rpc();
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err).to.exist;
    }
  });

  it("rejects out-of-range fee_bps", async () => {
    try {
      await ctx.program.methods
        .setConfig(200, null, null, null)
        .accounts({ program: ctx.program.programId })
        .rpc();
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.toString()).to.include("InvalidFee");
    }
  });
});
