/**
 * Full end-to-end lifecycle test.
 *
 * init_config → create_basket → add_tokens (×2) → deposit_multi → withdraw_multi
 *
 * Does NOT duplicate edge-case coverage from per-instruction tests.
 * Exists to verify all instructions compose correctly together.
 */
import { expect } from "chai";
import { Keypair } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import {
  createTestContext,
  fundAccount,
  createTestMint,
  createTestAta,
  mintTestTokens,
  getTokenBalance,
  findBasketPda,
  findVaultAuthorityPda,
  findMintAuthorityPda,
  findBasketTokenPda,
  findFeeVaultPda,
} from "../setup";

describe("full lifecycle", () => {
  it("config → basket → tokens → deposit → withdraw", async () => {
    const ctx = createTestContext();
    const whitelistAuth = Keypair.generate();
    const basketId = new BN(42);

    function encodeName(name: string): number[] {
      const buf = Buffer.alloc(32, 0);
      buf.write(name, "utf-8");
      return Array.from(buf);
    }

    // ── 1. init_config ──
    await ctx.program.methods
      .initConfig(25, whitelistAuth.publicKey, false)
      .accounts({ program: ctx.program.programId })
      .rpc();

    // ── 2. create_basket ──
    const shareMintKp = Keypair.generate();
    const [basketPda] = findBasketPda(basketId);
    const [vaultAuthority] = findVaultAuthorityPda(basketId);
    const [mintAuthority] = findMintAuthorityPda(basketId);

    await ctx.program.methods
      .createBasket(basketId, encodeName("E2E Basket"), null)
      .accounts({
        shareMint: shareMintKp.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .signers([shareMintKp])
      .rpc();

    // ── 3. add_tokens (USDC + USDT) ──
    const usdcMint = await createTestMint(ctx.provider, ctx.admin.publicKey, 6);
    const usdtMint = await createTestMint(ctx.provider, ctx.admin.publicKey, 6);

    const [btUsdc] = findBasketTokenPda(basketPda, usdcMint);
    const [fvUsdc] = findFeeVaultPda(basketPda, usdcMint);
    const vaultUsdc = await getAssociatedTokenAddress(
      usdcMint,
      vaultAuthority,
      true,
    );

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

    const [btUsdt] = findBasketTokenPda(basketPda, usdtMint);
    const [fvUsdt] = findFeeVaultPda(basketPda, usdtMint);
    const vaultUsdt = await getAssociatedTokenAddress(
      usdtMint,
      vaultAuthority,
      true,
    );

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

    // ── 4. deposit_multi (both tokens) ──
    const user = Keypair.generate();
    fundAccount(ctx.svm, user.publicKey);

    const userUsdcAta = await createTestAta(
      ctx.provider,
      usdcMint,
      user.publicKey,
    );
    const userUsdtAta = await createTestAta(
      ctx.provider,
      usdtMint,
      user.publicKey,
    );
    await mintTestTokens(
      ctx.provider,
      usdcMint,
      userUsdcAta,
      ctx.admin,
      BigInt(500_000_000),
    );
    await mintTestTokens(
      ctx.provider,
      usdtMint,
      userUsdtAta,
      ctx.admin,
      BigInt(300_000_000),
    );

    const userShareAta = await getAssociatedTokenAddress(
      shareMintKp.publicKey,
      user.publicKey,
    );

    await ctx.program.methods
      .depositMulti([new BN(500_000_000), new BN(300_000_000)])
      .accounts({
        user: user.publicKey,
        basket: basketPda,
        mintAuthority,
        shareMint: shareMintKp.publicKey,
        userAllowList: null,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .remainingAccounts([
        { pubkey: btUsdc, isWritable: false, isSigner: false },
        { pubkey: usdcMint, isWritable: false, isSigner: false },
        { pubkey: userUsdcAta, isWritable: true, isSigner: false },
        { pubkey: vaultUsdc, isWritable: true, isSigner: false },
        { pubkey: fvUsdc, isWritable: true, isSigner: false },
        { pubkey: btUsdt, isWritable: false, isSigner: false },
        { pubkey: usdtMint, isWritable: false, isSigner: false },
        { pubkey: userUsdtAta, isWritable: true, isSigner: false },
        { pubkey: vaultUsdt, isWritable: true, isSigner: false },
        { pubkey: fvUsdt, isWritable: true, isSigner: false },
      ])
      .signers([user])
      .rpc();

    const sharesAfterDeposit = await getTokenBalance(
      ctx.provider,
      userShareAta,
    );
    expect(Number(sharesAfterDeposit)).to.be.greaterThan(0);

    // ── 5. withdraw_multi (burn all shares) ──
    await ctx.program.methods
      .withdrawMulti(new BN(Number(sharesAfterDeposit)))
      .accounts({
        user: user.publicKey,
        basket: basketPda,
        shareMint: shareMintKp.publicKey,
        vaultAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .remainingAccounts([
        { pubkey: btUsdc, isWritable: false, isSigner: false },
        { pubkey: usdcMint, isWritable: false, isSigner: false },
        { pubkey: vaultUsdc, isWritable: true, isSigner: false },
        { pubkey: userUsdcAta, isWritable: true, isSigner: false },
        { pubkey: btUsdt, isWritable: false, isSigner: false },
        { pubkey: usdtMint, isWritable: false, isSigner: false },
        { pubkey: vaultUsdt, isWritable: true, isSigner: false },
        { pubkey: userUsdtAta, isWritable: true, isSigner: false },
      ])
      .signers([user])
      .rpc();

    const sharesAfterWithdraw = await getTokenBalance(
      ctx.provider,
      userShareAta,
    );
    expect(Number(sharesAfterWithdraw)).to.equal(0);

    const finalUsdc = await getTokenBalance(ctx.provider, userUsdcAta);
    const finalUsdt = await getTokenBalance(ctx.provider, userUsdtAta);
    expect(Number(finalUsdc)).to.be.greaterThan(0);
    expect(Number(finalUsdt)).to.be.greaterThan(0);
  });
});
