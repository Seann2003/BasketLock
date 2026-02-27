# Basketlock Solana Frontend SDK Design

## Overview

Domain-layered SDK under `lib/solana/` using `@solana/kit` v6 purely (no Anchor TS client). Provides full transaction lifecycle: build instructions, assemble transactions, sign, send, and confirm. The caller never manually constructs remaining accounts arrays or PDA derivations.

## File Structure

```
lib/solana/
├── constants.ts        # Program ID, PDA seeds, fee bounds, discriminators
├── client.ts           # RPC singleton via createSolanaRpc()
├── codecs.ts           # Borsh decoders for all 4 account types
├── types.ts            # Parsed frontend interfaces + parser helpers
├── pdas.ts             # 8 PDA derivation functions
├── accounts.ts         # Typed fetch: fetchConfig, fetchBasket, fetchAllBasketTokens, etc.
├── instructions/
│   ├── init-config.ts
│   ├── set-config.ts
│   ├── create-basket.ts
│   ├── add-tokens.ts
│   ├── deposit-multi.ts
│   ├── withdraw-multi.ts
│   ├── update-allow-list.ts
│   └── index.ts
└── transactions.ts     # buildAndSendTransaction(), confirmTransaction()
```

Data flow: `constants` → `pdas` → `codecs` → `types` → `accounts` → `instructions` → `transactions`. No circular dependencies.

## Types

Parsed interfaces that convert on-chain data to frontend-friendly shapes:

- `ParsedConfig` — admin/whitelistAuth as base58 strings, feeBps as number, complianceEnabled as boolean
- `ParsedBasket` — basketId as bigint, name decoded from [u8;32] to trimmed string, feeBpsOverride collapsed from has_fee_override + fee_bps_override into number | null
- `ParsedBasketToken` — all pubkeys as strings, decimals/enabled as native types
- `ParsedUserAllowList` — basket/user as strings, allowed as boolean

## Codecs

Hand-rolled Borsh decoders using Kit codec primitives (getStructCodec, getU8Codec, getU16Codec, getU64Codec, getBooleanCodec, getAddressCodec, fixCodecSize, getBytesCodec). Each decoder skips the 8-byte Anchor discriminator. Basket uses fixed-size C-repr layout (bytemuck).

## PDAs

Pure async functions using Kit's `getProgramDerivedAddress()`. Each returns `Promise<[Address, number]>`:

- `getConfigPda()` — seeds: [CONFIG_SEED]
- `getBasketPda(basketId)` — seeds: [BASKET_SEED, u64LE(basketId)]
- `getVaultAuthorityPda(basketId)` — seeds: [VAULT_AUTHORITY_SEED, u64LE(basketId)]
- `getMintAuthorityPda(basketId)` — seeds: [MINT_AUTHORITY_SEED, u64LE(basketId)]
- `getBasketTokenPda(basket, mint)` — seeds: [BASKET_TOKEN_SEED, basket, mint]
- `getFeeVaultPda(basket, mint)` — seeds: [FEE_VAULT_SEED, basket, mint]
- `getUserAllowListPda(basket, user)` — seeds: [USER_ALLOW_SEED, basket, user]
- `getEventAuthorityPda()` — seeds: [EVENT_AUTHORITY_SEED]

## Instructions

Each file exports one async builder function. Takes typed params + payer address, derives all PDAs internally, encodes args, returns `IInstruction`.

Key complexity is in deposit_multi and withdraw_multi which assemble remaining accounts arrays:

- **deposit_multi**: per token → [basketTokenPda, mint, userAta, vaultAta, feeVaultAta] (5 accounts)
- **withdraw_multi**: per token → [basketTokenPda, mint, vaultAta, userAta] (4 accounts)

The caller passes an array of token mints; the builder derives everything else.

## Accounts (Fetching)

Typed fetch functions that derive PDAs, call `rpc.getAccountInfo()`, decode via codecs, return parsed types or null. `fetchAllBasketTokens` and `fetchAllBaskets` use `getProgramAccounts` with discriminator memcmp filters.

## Transactions

Full lifecycle:

- `buildTransaction(rpc, instructions, payer, signers?)` — blockhash + V0 compile
- `buildAndSendTransaction(rpc, rpcSubscriptions, instructions, payer, signTransaction, signers?)` — build + sign + send + confirm, returns signature
- `confirmTransaction(rpcSubscriptions, signature, commitment?)` — subscription-based confirmation

## Client

- `createBasketlockClient(endpoint, wsEndpoint?)` — returns `{ rpc, rpcSubscriptions }`
- `getClient()` — lazy singleton from `NEXT_PUBLIC_RPC_URL`

## Decisions

- **@solana/kit pure**: No Anchor TS dependency. Tree-shakeable, modern.
- **Domain-layered over class-based**: Functional style matches Kit idioms. Each file has one responsibility.
- **Full lifecycle transactions**: SDK handles blockhash, signing, sending, confirmation. Caller provides wallet's signTransaction callback.
- **Remaining accounts abstracted**: deposit/withdraw builders take token mints array and derive all per-token accounts internally.
