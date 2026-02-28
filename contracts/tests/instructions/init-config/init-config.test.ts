import { expect } from "chai";
import { Keypair } from "@solana/web3.js";
import {
  createTestContext,
  findConfigPda,
  type TestContext,
} from "../../setup";

describe("init_config", () => {
  let ctx: TestContext;
  const whitelistAuth = Keypair.generate();

  beforeEach(() => {
    ctx = createTestContext();
  });

  it("initializes the global config with valid params", async () => {
    await ctx.program.methods
      .initConfig(20, whitelistAuth.publicKey, false)
      .accounts({ program: ctx.program.programId })
      .rpc();

    const [configPda] = findConfigPda();
    const config = await ctx.program.account.config.fetch(configPda);
    expect(config.admin.toBase58()).to.equal(ctx.admin.publicKey.toBase58());
    expect(config.feeBps).to.equal(20);
    expect(config.complianceEnabled).to.equal(false);
    expect(config.version).to.equal(1);
  });

  it("rejects fee_bps below minimum (10)", async () => {
    try {
      await ctx.program.methods
        .initConfig(5, whitelistAuth.publicKey, false)
        .accounts({ program: ctx.program.programId })
        .rpc();
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.toString()).to.include("InvalidFee");
    }
  });

  it("rejects fee_bps above maximum (50)", async () => {
    try {
      await ctx.program.methods
        .initConfig(100, whitelistAuth.publicKey, false)
        .accounts({ program: ctx.program.programId })
        .rpc();
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.toString()).to.include("InvalidFee");
    }
  });

  it("cannot be called twice (PDA already exists)", async () => {
    await ctx.program.methods
      .initConfig(20, whitelistAuth.publicKey, false)
      .accounts({ program: ctx.program.programId })
      .rpc();

    try {
      await ctx.program.methods
        .initConfig(30, whitelistAuth.publicKey, true)
        .accounts({ program: ctx.program.programId })
        .rpc();
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err).to.exist;
    }
  });
});
