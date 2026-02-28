import { expect } from "chai";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  createTestContext,
  createTestMint,
  findBasketPda,
  findVaultAuthorityPda,
  findBasketTokenPda,
  type TestContext,
} from "../../setup";

describe("add_tokens", () => {
  let ctx: TestContext;
  const whitelistAuth = Keypair.generate();
  const basketId = new BN(1);
  let basketPda: PublicKey;
  let vaultAuthority: PublicKey;

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

    const shareMint = Keypair.generate();
    [basketPda] = findBasketPda(basketId);
    [vaultAuthority] = findVaultAuthorityPda(basketId);

    await ctx.program.methods
      .createBasket(basketId, encodeName("Test Basket"), null)
      .accounts({
        shareMint: shareMint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .signers([shareMint])
      .rpc();
  });

  // Must pass: basket (none), underlyingMint (none), vaultAuthority (none), tokenProgram (none)
  // Auto-derived: admin (relations), config (pda), basketToken (pda), vaultAta (pda),
  //               feeVaultAta (pda), associatedTokenProgram (address), systemProgram (address)

  it("registers a new underlying mint", async () => {
    const usdcMint = await createTestMint(ctx.provider, ctx.admin.publicKey, 6);

    await ctx.program.methods
      .addTokens()
      .accounts({
        basket: basketPda,
        underlyingMint: usdcMint,
        vaultAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .rpc();

    const [basketTokenPda] = findBasketTokenPda(basketPda, usdcMint);
    const basketToken = await ctx.program.account.basketToken.fetch(
      basketTokenPda,
    );
    expect(basketToken.basket.toBase58()).to.equal(basketPda.toBase58());
    expect(basketToken.mint.toBase58()).to.equal(usdcMint.toBase58());
    expect(basketToken.enabled).to.equal(true);
    expect(basketToken.decimals).to.equal(6);

    const basket = await ctx.program.account.basket.fetch(basketPda);
    expect(basket.tokenCount).to.equal(1);
  });

  it("can register multiple different mints", async () => {
    const usdcMint = await createTestMint(ctx.provider, ctx.admin.publicKey, 6);
    const usdtMint = await createTestMint(ctx.provider, ctx.admin.publicKey, 6);

    await ctx.program.methods
      .addTokens()
      .accounts({
        basket: basketPda,
        underlyingMint: usdcMint,
        vaultAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .rpc();

    await ctx.program.methods
      .addTokens()
      .accounts({
        basket: basketPda,
        underlyingMint: usdtMint,
        vaultAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .rpc();

    const basket = await ctx.program.account.basket.fetch(basketPda);
    expect(basket.tokenCount).to.equal(2);
  });
});
