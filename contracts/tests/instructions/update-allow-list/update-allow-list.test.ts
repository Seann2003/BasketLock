import { expect } from "chai";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  createTestContext,
  fundAccount,
  findBasketPda,
  findUserAllowListPda,
  type TestContext,
} from "../../setup";

describe("update_allow_list", () => {
  let ctx: TestContext;
  const whitelistAuth = Keypair.generate();
  const basketId = new BN(1);
  let basketPda: PublicKey;

  function encodeName(name: string): number[] {
    const buf = Buffer.alloc(32, 0);
    buf.write(name, "utf-8");
    return Array.from(buf);
  }

  beforeEach(async () => {
    ctx = createTestContext();
    fundAccount(ctx.svm, whitelistAuth.publicKey);

    await ctx.program.methods
      .initConfig(20, whitelistAuth.publicKey, true)
      .accounts({ program: ctx.program.programId })
      .rpc();

    const shareMint = Keypair.generate();
    [basketPda] = findBasketPda(basketId);

    await ctx.program.methods
      .createBasket(basketId, encodeName("Allow Test"), null)
      .accounts({
        shareMint: shareMint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .signers([shareMint])
      .rpc();
  });

  it("creates an allow-list entry for a user", async () => {
    const user = Keypair.generate();

    await ctx.program.methods
      .updateAllowList(true)
      .accounts({
        authority: whitelistAuth.publicKey,
        basket: basketPda,
        user: user.publicKey,
        program: ctx.program.programId,
      })
      .signers([whitelistAuth])
      .rpc();

    const [allowListPda] = findUserAllowListPda(basketPda, user.publicKey);
    const entry = await ctx.program.account.userAllowList.fetch(allowListPda);
    expect(entry.allowed).to.equal(true);
    expect(entry.user.toBase58()).to.equal(user.publicKey.toBase58());
  });

  it("toggles allow-list entry off and back on (init_if_needed)", async () => {
    const user = Keypair.generate();

    await ctx.program.methods
      .updateAllowList(true)
      .accounts({
        authority: whitelistAuth.publicKey,
        basket: basketPda,
        user: user.publicKey,
        program: ctx.program.programId,
      })
      .signers([whitelistAuth])
      .rpc();

    const [allowListPda] = findUserAllowListPda(basketPda, user.publicKey);
    let entry = await ctx.program.account.userAllowList.fetch(allowListPda);
    expect(entry.allowed).to.equal(true);

    // Expire blockhash to avoid duplicate tx detection in LiteSVM
    ctx.svm.expireBlockhash();

    await ctx.program.methods
      .updateAllowList(false)
      .accounts({
        authority: whitelistAuth.publicKey,
        basket: basketPda,
        user: user.publicKey,
        program: ctx.program.programId,
      })
      .signers([whitelistAuth])
      .rpc();

    entry = await ctx.program.account.userAllowList.fetch(allowListPda);
    expect(entry.allowed).to.equal(false);

    ctx.svm.expireBlockhash();

    await ctx.program.methods
      .updateAllowList(true)
      .accounts({
        authority: whitelistAuth.publicKey,
        basket: basketPda,
        user: user.publicKey,
        program: ctx.program.programId,
      })
      .signers([whitelistAuth])
      .rpc();

    entry = await ctx.program.account.userAllowList.fetch(allowListPda);
    expect(entry.allowed).to.equal(true);
  });

  it("rejects non-whitelist-auth caller", async () => {
    const user = Keypair.generate();
    const impostor = Keypair.generate();
    fundAccount(ctx.svm, impostor.publicKey);

    try {
      await ctx.program.methods
        .updateAllowList(true)
        .accounts({
          basket: basketPda,
          user: user.publicKey,
          program: ctx.program.programId,
        })
        .signers([impostor])
        .rpc();
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err).to.exist;
    }
  });
});
