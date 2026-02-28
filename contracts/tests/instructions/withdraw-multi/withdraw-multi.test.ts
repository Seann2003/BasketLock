import { expect } from "chai";
import { Keypair, PublicKey } from "@solana/web3.js";
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
  type TestContext,
} from "../../setup";

describe("withdraw_multi", () => {
  let ctx: TestContext;
  const whitelistAuth = Keypair.generate();
  const basketId = new BN(1);

  let basketPda: PublicKey;
  let vaultAuthority: PublicKey;
  let mintAuthority: PublicKey;
  let shareMintKp: Keypair;
  let usdcMint: PublicKey;
  let usdtMint: PublicKey;
  let btUsdc: PublicKey;
  let btUsdt: PublicKey;
  let fvUsdc: PublicKey;
  let fvUsdt: PublicKey;
  let vaultUsdc: PublicKey;
  let vaultUsdt: PublicKey;
  let user: Keypair;
  let userUsdcAta: PublicKey;
  let userUsdtAta: PublicKey;
  let userShareAta: PublicKey;

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

    shareMintKp = Keypair.generate();
    [basketPda] = findBasketPda(basketId);
    [vaultAuthority] = findVaultAuthorityPda(basketId);
    [mintAuthority] = findMintAuthorityPda(basketId);

    await ctx.program.methods
      .createBasket(basketId, encodeName("Withdraw Test"), null)
      .accounts({
        shareMint: shareMintKp.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .signers([shareMintKp])
      .rpc();

    usdcMint = await createTestMint(ctx.provider, ctx.admin.publicKey, 6);
    usdtMint = await createTestMint(ctx.provider, ctx.admin.publicKey, 6);

    [btUsdc] = findBasketTokenPda(basketPda, usdcMint);
    [fvUsdc] = findFeeVaultPda(basketPda, usdcMint);
    vaultUsdc = await getAssociatedTokenAddress(usdcMint, vaultAuthority, true);

    [btUsdt] = findBasketTokenPda(basketPda, usdtMint);
    [fvUsdt] = findFeeVaultPda(basketPda, usdtMint);
    vaultUsdt = await getAssociatedTokenAddress(usdtMint, vaultAuthority, true);

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

    // Deposit as user to seed vault + shares
    user = Keypair.generate();
    fundAccount(ctx.svm, user.publicKey);
    userUsdcAta = await createTestAta(ctx.provider, usdcMint, user.publicKey);
    userUsdtAta = await createTestAta(ctx.provider, usdtMint, user.publicKey);
    await mintTestTokens(
      ctx.provider,
      usdcMint,
      userUsdcAta,
      ctx.admin,
      BigInt(1_000_000_000),
    );
    await mintTestTokens(
      ctx.provider,
      usdtMint,
      userUsdtAta,
      ctx.admin,
      BigInt(500_000_000),
    );

    userShareAta = await getAssociatedTokenAddress(
      shareMintKp.publicKey,
      user.publicKey,
    );

    await ctx.program.methods
      .depositMulti([new BN(1_000_000_000), new BN(500_000_000)])
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
  });

  it("burns QSHARE and returns proportional underlying (all tokens)", async () => {
    const sharesBefore = await getTokenBalance(ctx.provider, userShareAta);
    expect(Number(sharesBefore)).to.be.greaterThan(0);

    await ctx.program.methods
      .withdrawMulti(new BN(Number(sharesBefore)))
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

    const sharesAfter = await getTokenBalance(ctx.provider, userShareAta);
    expect(Number(sharesAfter)).to.equal(0);

    const usdcBalance = await getTokenBalance(ctx.provider, userUsdcAta);
    expect(Number(usdcBalance)).to.be.greaterThan(0);

    const usdtBalance = await getTokenBalance(ctx.provider, userUsdtAta);
    expect(Number(usdtBalance)).to.be.greaterThan(0);

    const vaultUsdcBalance = await getTokenBalance(ctx.provider, vaultUsdc);
    expect(Number(vaultUsdcBalance)).to.equal(0);

    const vaultUsdtBalance = await getTokenBalance(ctx.provider, vaultUsdt);
    expect(Number(vaultUsdtBalance)).to.equal(0);
  });

  it("rejects incomplete withdrawal (only 1 of 2 tokens)", async () => {
    const sharesBefore = await getTokenBalance(ctx.provider, userShareAta);

    try {
      await ctx.program.methods
        .withdrawMulti(new BN(Number(sharesBefore)))
        .accounts({
          user: user.publicKey,
          basket: basketPda,
          shareMint: shareMintKp.publicKey,
          vaultAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          program: ctx.program.programId,
        })
        .remainingAccounts([
          // Only providing USDC — missing USDT
          { pubkey: btUsdc, isWritable: false, isSigner: false },
          { pubkey: usdcMint, isWritable: false, isSigner: false },
          { pubkey: vaultUsdc, isWritable: true, isSigner: false },
          { pubkey: userUsdcAta, isWritable: true, isSigner: false },
        ])
        .signers([user])
        .rpc();
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.toString()).to.include("IncompleteWithdrawal");
    }
  });

  it("rejects withdrawal with zero shares", async () => {
    try {
      await ctx.program.methods
        .withdrawMulti(new BN(0))
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
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.toString()).to.include("InsufficientShares");
    }
  });
});
