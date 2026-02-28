import { expect } from "chai";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
import { getAssociatedTokenAddress } from "@solana/spl-token";

describe("deposit_multi", () => {
  let ctx: TestContext;
  const whitelistAuth = Keypair.generate();
  const basketId = new BN(1);

  let basketPda: PublicKey;
  let vaultAuthority: PublicKey;
  let mintAuthority: PublicKey;
  let shareMintKp: Keypair;
  let usdcMint: PublicKey;
  let basketTokenPda: PublicKey;
  let feeVaultPda: PublicKey;
  let vaultAta: PublicKey;

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
      .createBasket(basketId, encodeName("Deposit Test"), null)
      .accounts({
        shareMint: shareMintKp.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .signers([shareMintKp])
      .rpc();

    usdcMint = await createTestMint(ctx.provider, ctx.admin.publicKey, 6);
    [basketTokenPda] = findBasketTokenPda(basketPda, usdcMint);
    [feeVaultPda] = findFeeVaultPda(basketPda, usdcMint);
    vaultAta = await getAssociatedTokenAddress(usdcMint, vaultAuthority, true);

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
  });

  it("deposits tokens and mints QSHARE to user", async () => {
    const user = Keypair.generate();
    fundAccount(ctx.svm, user.publicKey);

    const userUsdcAta = await createTestAta(
      ctx.provider,
      usdcMint,
      user.publicKey,
    );
    await mintTestTokens(
      ctx.provider,
      usdcMint,
      userUsdcAta,
      ctx.admin,
      BigInt(1_000_000_000),
    );

    const userShareAta = await getAssociatedTokenAddress(
      shareMintKp.publicKey,
      user.publicKey,
    );

    await ctx.program.methods
      .depositMulti([new BN(1_000_000_000)])
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
        { pubkey: basketTokenPda, isWritable: false, isSigner: false },
        { pubkey: usdcMint, isWritable: false, isSigner: false },
        { pubkey: userUsdcAta, isWritable: true, isSigner: false },
        { pubkey: vaultAta, isWritable: true, isSigner: false },
        { pubkey: feeVaultPda, isWritable: true, isSigner: false },
      ])
      .signers([user])
      .rpc();

    const shareBalance = await getTokenBalance(ctx.provider, userShareAta);
    expect(Number(shareBalance)).to.be.greaterThan(0);

    const vaultBalance = await getTokenBalance(ctx.provider, vaultAta);
    expect(Number(vaultBalance)).to.be.greaterThan(0);

    const feeBalance = await getTokenBalance(ctx.provider, feeVaultPda);
    expect(Number(feeBalance)).to.be.greaterThan(0);
  });

  it("second depositor gets proportional shares (vault-weighted)", async () => {
    // First depositor
    const user1 = Keypair.generate();
    fundAccount(ctx.svm, user1.publicKey);
    const user1UsdcAta = await createTestAta(
      ctx.provider,
      usdcMint,
      user1.publicKey,
    );
    await mintTestTokens(
      ctx.provider,
      usdcMint,
      user1UsdcAta,
      ctx.admin,
      BigInt(1_000_000_000),
    );

    const user1ShareAta = await getAssociatedTokenAddress(
      shareMintKp.publicKey,
      user1.publicKey,
    );

    await ctx.program.methods
      .depositMulti([new BN(1_000_000_000)])
      .accounts({
        user: user1.publicKey,
        basket: basketPda,
        mintAuthority,
        shareMint: shareMintKp.publicKey,
        userAllowList: null,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .remainingAccounts([
        { pubkey: basketTokenPda, isWritable: false, isSigner: false },
        { pubkey: usdcMint, isWritable: false, isSigner: false },
        { pubkey: user1UsdcAta, isWritable: true, isSigner: false },
        { pubkey: vaultAta, isWritable: true, isSigner: false },
        { pubkey: feeVaultPda, isWritable: true, isSigner: false },
      ])
      .signers([user1])
      .rpc();

    const user1Shares = await getTokenBalance(ctx.provider, user1ShareAta);
    expect(Number(user1Shares)).to.be.greaterThan(0);

    // Second depositor — same amount, should get roughly equal shares
    const user2 = Keypair.generate();
    fundAccount(ctx.svm, user2.publicKey);
    const user2UsdcAta = await createTestAta(
      ctx.provider,
      usdcMint,
      user2.publicKey,
    );
    await mintTestTokens(
      ctx.provider,
      usdcMint,
      user2UsdcAta,
      ctx.admin,
      BigInt(1_000_000_000),
    );

    const user2ShareAta = await getAssociatedTokenAddress(
      shareMintKp.publicKey,
      user2.publicKey,
    );

    await ctx.program.methods
      .depositMulti([new BN(1_000_000_000)])
      .accounts({
        user: user2.publicKey,
        basket: basketPda,
        mintAuthority,
        shareMint: shareMintKp.publicKey,
        userAllowList: null,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .remainingAccounts([
        { pubkey: basketTokenPda, isWritable: false, isSigner: false },
        { pubkey: usdcMint, isWritable: false, isSigner: false },
        { pubkey: user2UsdcAta, isWritable: true, isSigner: false },
        { pubkey: vaultAta, isWritable: true, isSigner: false },
        { pubkey: feeVaultPda, isWritable: true, isSigner: false },
      ])
      .signers([user2])
      .rpc();

    const user2Shares = await getTokenBalance(ctx.provider, user2ShareAta);
    expect(Number(user2Shares)).to.be.greaterThan(0);

    // With vault-weighted pricing and same deposit amount,
    // second depositor should get shares proportional to their deposit
    // relative to existing vault value. Since both deposit the same
    // gross amount, user2 should get approximately equal shares to user1.
    const ratio = Number(user2Shares) / Number(user1Shares);
    expect(ratio).to.be.greaterThan(0.9);
    expect(ratio).to.be.lessThan(1.1);
  });

  it("rejects zero-amount deposit", async () => {
    const user = Keypair.generate();
    fundAccount(ctx.svm, user.publicKey);
    const userUsdcAta = await createTestAta(
      ctx.provider,
      usdcMint,
      user.publicKey,
    );

    try {
      await ctx.program.methods
        .depositMulti([new BN(0)])
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
          { pubkey: basketTokenPda, isWritable: false, isSigner: false },
          { pubkey: usdcMint, isWritable: false, isSigner: false },
          { pubkey: userUsdcAta, isWritable: true, isSigner: false },
          { pubkey: vaultAta, isWritable: true, isSigner: false },
          { pubkey: feeVaultPda, isWritable: true, isSigner: false },
        ])
        .signers([user])
        .rpc();
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.toString()).to.include("ZeroDeposit");
    }
  });
});
