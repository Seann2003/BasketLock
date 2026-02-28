import { expect } from "chai";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  createTestContext,
  findBasketPda,
  findVaultAuthorityPda,
  type TestContext,
} from "../../setup";

describe("verify_basket_owner", () => {
  let ctx: TestContext;
  const whitelistAuth = Keypair.generate();
  const basketId = new BN(1);
  let basketPda: PublicKey;
  let vaultAuthority: PublicKey;
  let shareMintKp: Keypair;

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

    await ctx.program.methods
      .createBasket(basketId, encodeName("Verify Test"), null)
      .accounts({
        shareMint: shareMintKp.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        program: ctx.program.programId,
      })
      .signers([shareMintKp])
      .rpc();
  });

  it("succeeds with correct owner", async () => {
    await ctx.program.methods
      .verifyBasketOwner(ctx.admin.publicKey)
      .accounts({
        basket: basketPda,
        shareMint: shareMintKp.publicKey,
        vaultAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  });

  it("fails with wrong owner", async () => {
    const wrongOwner = Keypair.generate();

    try {
      await ctx.program.methods
        .verifyBasketOwner(wrongOwner.publicKey)
        .accounts({
          basket: basketPda,
          shareMint: shareMintKp.publicKey,
          vaultAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.toString()).to.include("OwnerMismatch");
    }
  });
});
