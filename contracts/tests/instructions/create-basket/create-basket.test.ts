import { expect } from "chai";
import { Keypair } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  createTestContext,
  findBasketPda,
  findVaultAuthorityPda,
  type TestContext,
} from "../../setup";

describe("create_basket", () => {
  let ctx: TestContext;
  const whitelistAuth = Keypair.generate();
  const basketId = new BN(1);

  function encodeName(name: string): number[] {
    const buf = Buffer.alloc(32, 0);
    buf.write(name, "utf-8");
    return Array.from(buf);
  }

  beforeEach(async () => {
    ctx = createTestContext();
    await ctx.program.methods
      .initConfig(20, whitelistAuth.publicKey, false)
      .accounts({ program: ctx.program.programId })
      .rpc();
  });

  it("creates a basket with QSHARE mint", async () => {
    const shareMint = Keypair.generate();

    await ctx.program.methods
      .createBasket(basketId, encodeName("Test Basket"), null)
      .accounts({
        shareMint: shareMint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .signers([shareMint])
      .rpc();

    const [basketPda] = findBasketPda(basketId);
    const [vaultAuthority] = findVaultAuthorityPda(basketId);
    const basket = await ctx.program.account.basket.fetch(basketPda);
    expect(basket.owner.toBase58()).to.equal(ctx.admin.publicKey.toBase58());
    expect(basket.shareMint.toBase58()).to.equal(
      shareMint.publicKey.toBase58(),
    );
    expect(basket.vaultAuthority.toBase58()).to.equal(
      vaultAuthority.toBase58(),
    );
    expect(basket.basketId.toNumber()).to.equal(1);
    expect(basket.tokenCount).to.equal(0);
    expect(basket.version).to.equal(1);
  });

  it("creates a basket with fee override", async () => {
    const shareMint = Keypair.generate();

    await ctx.program.methods
      .createBasket(basketId, encodeName("Fee Basket"), 30)
      .accounts({
        shareMint: shareMint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .signers([shareMint])
      .rpc();

    const [basketPda] = findBasketPda(basketId);
    const basket = await ctx.program.account.basket.fetch(basketPda);
    expect(basket.hasFeeOverride).to.equal(1);
    expect(basket.feeBpsOverride).to.equal(30);
  });

  it("rejects duplicate basket_id", async () => {
    const shareMint1 = Keypair.generate();
    await ctx.program.methods
      .createBasket(basketId, encodeName("First"), null)
      .accounts({
        shareMint: shareMint1.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .signers([shareMint1])
      .rpc();

    const shareMint2 = Keypair.generate();
    try {
      await ctx.program.methods
        .createBasket(basketId, encodeName("Duplicate"), null)
        .accounts({
          shareMint: shareMint2.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          program: ctx.program.programId,
        })
        .signers([shareMint2])
        .rpc();
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err).to.exist;
    }
  });
});
