# Basketlock Solana Frontend SDK — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a modular, Kit-native Solana frontend SDK under `lib/solana/` that provides typed account fetching, PDA derivation, instruction building, and full transaction lifecycle for the Basketlock protocol.

**Architecture:** Domain-layered functional modules. Each file has one responsibility. Data flows: constants → pdas → codecs → types → accounts → instructions → transactions. No circular dependencies. All imports from `@solana/kit`.

**Tech Stack:** @solana/kit v6, TypeScript, Next.js 16

---

### Task 1: Constants

**Files:**
- Create: `lib/solana/constants.ts`

**Step 1: Write constants file**

```ts
import type { Address } from "@solana/kit";

export const PROGRAM_ID =
  "2rQ6Auaeqovph67yWxhFpuhitrJJkGU3jrZwUUSYJKs6" as Address<"2rQ6Auaeqovph67yWxhFpuhitrJJkGU3jrZwUUSYJKs6">;

export const CONFIG_SEED = new TextEncoder().encode("config");
export const BASKET_SEED = new TextEncoder().encode("basket");
export const BASKET_TOKEN_SEED = new TextEncoder().encode("basket_token");
export const VAULT_AUTHORITY_SEED = new TextEncoder().encode("vault_authority");
export const MINT_AUTHORITY_SEED = new TextEncoder().encode("mint_authority");
export const FEE_VAULT_SEED = new TextEncoder().encode("fee_vault");
export const USER_ALLOW_SEED = new TextEncoder().encode("user_allow");
export const EVENT_AUTHORITY_SEED = new TextEncoder().encode("__event_authority");

export const SYSTEM_PROGRAM_ID =
  "11111111111111111111111111111111" as Address<"11111111111111111111111111111111">;
export const TOKEN_PROGRAM_ID =
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address<"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA">;
export const ASSOCIATED_TOKEN_PROGRAM_ID =
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address<"ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL">;

export const FEE_BPS_MIN = 10;
export const FEE_BPS_MAX = 50;
export const MAX_TOKENS_PER_BASKET = 10;
export const MAX_NAME_LEN = 32;
export const QSHARE_DECIMALS = 6;

export const DEPOSIT_ACCOUNTS_PER_TOKEN = 5;
export const WITHDRAW_ACCOUNTS_PER_TOKEN = 4;

export const DISCRIMINATOR_SIZE = 8;

export const DISCRIMINATORS = {
  config: new Uint8Array([155, 12, 170, 224, 30, 250, 204, 130]),
  basket: new Uint8Array([219, 79, 107, 135, 231, 243, 218, 248]),
  basketToken: new Uint8Array([128, 193, 26, 209, 248, 236, 236, 212]),
  userAllowList: new Uint8Array([137, 62, 29, 246, 93, 233, 210, 156]),
} as const;

export const IX_DISCRIMINATORS = {
  initConfig: new Uint8Array([23, 235, 115, 232, 168, 96, 1, 231]),
  setConfig: new Uint8Array([108, 158, 154, 175, 212, 98, 52, 66]),
  createBasket: new Uint8Array([47, 105, 155, 148, 15, 169, 202, 211]),
  addTokens: new Uint8Array([28, 218, 30, 209, 175, 155, 153, 240]),
  depositMulti: new Uint8Array([249, 115, 113, 22, 161, 239, 200, 3]),
  withdrawMulti: new Uint8Array([251, 170, 190, 101, 141, 83, 90, 187]),
  updateAllowList: new Uint8Array([165, 6, 31, 198, 26, 197, 208, 181]),
  verifyBasketOwner: new Uint8Array([56, 82, 151, 199, 34, 243, 50, 105]),
} as const;
```

**Step 2: Commit**

```bash
git add lib/solana/constants.ts
git commit -m "feat: add Solana SDK constants"
```

---

### Task 2: Client

**Files:**
- Create: `lib/solana/client.ts`

**Step 1: Write client file**

```ts
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";

type BasketlockClient = {
  rpc: ReturnType<typeof createSolanaRpc>;
  rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
};

let clientInstance: BasketlockClient | null = null;

export function createBasketlockClient(
  endpoint: string,
  wsEndpoint?: string,
): BasketlockClient {
  const rpc = createSolanaRpc(endpoint);
  const ws = wsEndpoint ?? endpoint.replace("https", "wss");
  const rpcSubscriptions = createSolanaRpcSubscriptions(ws);
  return { rpc, rpcSubscriptions };
}

export function getClient(): BasketlockClient {
  if (!clientInstance) {
    const endpoint = process.env.NEXT_PUBLIC_RPC_URL;
    if (!endpoint) {
      throw new Error("NEXT_PUBLIC_RPC_URL is not set");
    }
    clientInstance = createBasketlockClient(endpoint);
  }
  return clientInstance;
}
```

**Step 2: Commit**

```bash
git add lib/solana/client.ts
git commit -m "feat: add Solana RPC client singleton"
```

---

### Task 3: PDAs

**Files:**
- Create: `lib/solana/pdas.ts`

**Step 1: Write PDAs file**

```ts
import {
  type Address,
  getProgramDerivedAddress,
  getAddressEncoder,
  type ProgramDerivedAddress,
} from "@solana/kit";
import {
  PROGRAM_ID,
  CONFIG_SEED,
  BASKET_SEED,
  BASKET_TOKEN_SEED,
  VAULT_AUTHORITY_SEED,
  MINT_AUTHORITY_SEED,
  FEE_VAULT_SEED,
  USER_ALLOW_SEED,
  EVENT_AUTHORITY_SEED,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "./constants";

const addressEncoder = getAddressEncoder();

function u64LE(value: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  const view = new DataView(buf.buffer);
  view.setBigUint64(0, value, true);
  return buf;
}

export function getConfigPda(): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [CONFIG_SEED],
  });
}

export function getBasketPda(
  basketId: bigint,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [BASKET_SEED, u64LE(basketId)],
  });
}

export function getVaultAuthorityPda(
  basketId: bigint,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [VAULT_AUTHORITY_SEED, u64LE(basketId)],
  });
}

export function getMintAuthorityPda(
  basketId: bigint,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [MINT_AUTHORITY_SEED, u64LE(basketId)],
  });
}

export function getBasketTokenPda(
  basket: Address,
  mint: Address,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [BASKET_TOKEN_SEED, addressEncoder.encode(basket), addressEncoder.encode(mint)],
  });
}

export function getFeeVaultPda(
  basket: Address,
  mint: Address,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [FEE_VAULT_SEED, addressEncoder.encode(basket), addressEncoder.encode(mint)],
  });
}

export function getUserAllowListPda(
  basket: Address,
  user: Address,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [USER_ALLOW_SEED, addressEncoder.encode(basket), addressEncoder.encode(user)],
  });
}

export function getEventAuthorityPda(): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [EVENT_AUTHORITY_SEED],
  });
}

export function getAssociatedTokenAddress(
  wallet: Address,
  tokenProgram: Address,
  mint: Address,
): Promise<ProgramDerivedAddress> {
  return getProgramDerivedAddress({
    programAddress: ASSOCIATED_TOKEN_PROGRAM_ID,
    seeds: [
      addressEncoder.encode(wallet),
      addressEncoder.encode(tokenProgram),
      addressEncoder.encode(mint),
    ],
  });
}
```

**Step 2: Commit**

```bash
git add lib/solana/pdas.ts
git commit -m "feat: add PDA derivation functions"
```

---

### Task 4: Codecs & Types

**Files:**
- Create: `lib/solana/codecs.ts`
- Create: `lib/solana/types.ts`

**Step 1: Write codecs file**

The Basket account uses bytemuck (C-repr, zero-copy) so its layout is fixed-size with no Borsh length prefixes. Config, BasketToken, and UserAllowList use standard Borsh serialization.

For all accounts, the first 8 bytes are the Anchor discriminator which we skip before decoding.

```ts
import {
  getStructCodec,
  getU8Codec,
  getU16Codec,
  getU64Codec,
  getBooleanCodec,
  getAddressCodec,
  fixCodecSize,
  getBytesCodec,
} from "@solana/kit";
import { DISCRIMINATOR_SIZE } from "./constants";

const addressCodec = getAddressCodec();

export const configCodec = getStructCodec([
  ["admin", addressCodec],
  ["whitelistAuth", addressCodec],
  ["feeBps", getU16Codec()],
  ["complianceEnabled", getBooleanCodec()],
  ["version", getU8Codec()],
  ["bump", getU8Codec()],
]);

export const basketCodec = getStructCodec([
  ["owner", addressCodec],
  ["shareMint", addressCodec],
  ["vaultAuthority", addressCodec],
  ["basketId", getU64Codec()],
  ["name", fixCodecSize(getBytesCodec(), 32)],
  ["feeBpsOverride", getU16Codec()],
  ["hasFeeOverride", getU8Codec()],
  ["tokenCount", getU8Codec()],
  ["version", getU8Codec()],
  ["basketBump", getU8Codec()],
  ["vaultAuthorityBump", getU8Codec()],
  ["mintAuthorityBump", getU8Codec()],
]);

export const basketTokenCodec = getStructCodec([
  ["basket", addressCodec],
  ["mint", addressCodec],
  ["vaultAta", addressCodec],
  ["feeVaultAta", addressCodec],
  ["decimals", getU8Codec()],
  ["enabled", getBooleanCodec()],
  ["bump", getU8Codec()],
]);

export const userAllowListCodec = getStructCodec([
  ["basket", addressCodec],
  ["user", addressCodec],
  ["allowed", getBooleanCodec()],
  ["bump", getU8Codec()],
]);

export function decodeAccount<T>(
  codec: { read: (bytes: ReadonlyUint8Array, offset: number) => [T, number] },
  data: Uint8Array,
): T {
  const [decoded] = codec.read(data, DISCRIMINATOR_SIZE);
  return decoded;
}
```

**Step 2: Write types file**

```ts
import type { Address } from "@solana/kit";
import {
  configCodec,
  basketCodec,
  basketTokenCodec,
  userAllowListCodec,
  decodeAccount,
} from "./codecs";

export type ParsedConfig = {
  admin: Address;
  whitelistAuth: Address;
  feeBps: number;
  complianceEnabled: boolean;
  version: number;
  bump: number;
};

export type ParsedBasket = {
  owner: Address;
  shareMint: Address;
  vaultAuthority: Address;
  basketId: bigint;
  name: string;
  feeBpsOverride: number | null;
  tokenCount: number;
  version: number;
  basketBump: number;
  vaultAuthorityBump: number;
  mintAuthorityBump: number;
};

export type ParsedBasketToken = {
  basket: Address;
  mint: Address;
  vaultAta: Address;
  feeVaultAta: Address;
  decimals: number;
  enabled: boolean;
  bump: number;
};

export type ParsedUserAllowList = {
  basket: Address;
  user: Address;
  allowed: boolean;
  bump: number;
};

export function parseConfig(data: Uint8Array): ParsedConfig {
  const raw = decodeAccount(configCodec, data);
  return {
    admin: raw.admin,
    whitelistAuth: raw.whitelistAuth,
    feeBps: raw.feeBps,
    complianceEnabled: raw.complianceEnabled,
    version: raw.version,
    bump: raw.bump,
  };
}

export function parseBasket(data: Uint8Array): ParsedBasket {
  const raw = decodeAccount(basketCodec, data);
  const nameBytes = raw.name instanceof Uint8Array ? raw.name : new Uint8Array(raw.name);
  const nullIdx = nameBytes.indexOf(0);
  const name = new TextDecoder().decode(
    nullIdx === -1 ? nameBytes : nameBytes.slice(0, nullIdx),
  );
  return {
    owner: raw.owner,
    shareMint: raw.shareMint,
    vaultAuthority: raw.vaultAuthority,
    basketId: raw.basketId,
    name,
    feeBpsOverride: raw.hasFeeOverride === 1 ? raw.feeBpsOverride : null,
    tokenCount: raw.tokenCount,
    version: raw.version,
    basketBump: raw.basketBump,
    vaultAuthorityBump: raw.vaultAuthorityBump,
    mintAuthorityBump: raw.mintAuthorityBump,
  };
}

export function parseBasketToken(data: Uint8Array): ParsedBasketToken {
  const raw = decodeAccount(basketTokenCodec, data);
  return {
    basket: raw.basket,
    mint: raw.mint,
    vaultAta: raw.vaultAta,
    feeVaultAta: raw.feeVaultAta,
    decimals: raw.decimals,
    enabled: raw.enabled,
    bump: raw.bump,
  };
}

export function parseUserAllowList(data: Uint8Array): ParsedUserAllowList {
  const raw = decodeAccount(userAllowListCodec, data);
  return {
    basket: raw.basket,
    user: raw.user,
    allowed: raw.allowed,
    bump: raw.bump,
  };
}
```

**Step 3: Commit**

```bash
git add lib/solana/codecs.ts lib/solana/types.ts
git commit -m "feat: add Borsh codecs and parsed account types"
```

---

### Task 5: Accounts (Fetching)

**Files:**
- Create: `lib/solana/accounts.ts`

**Step 1: Write accounts file**

Uses `fetchEncodedAccount` from Kit for single-account fetches, and `rpc.getProgramAccounts()` for multi-account fetches with discriminator memcmp filters.

```ts
import type { Address, Rpc, GetAccountInfoApi, GetProgramAccountsApi } from "@solana/kit";
import { fetchEncodedAccount } from "@solana/kit";
import { PROGRAM_ID, DISCRIMINATORS, DISCRIMINATOR_SIZE } from "./constants";
import {
  getConfigPda,
  getBasketPda,
  getBasketTokenPda,
  getUserAllowListPda,
} from "./pdas";
import {
  type ParsedConfig,
  type ParsedBasket,
  type ParsedBasketToken,
  type ParsedUserAllowList,
  parseConfig,
  parseBasket,
  parseBasketToken,
  parseUserAllowList,
} from "./types";
import { getAddressEncoder } from "@solana/kit";

type FetchRpc = Rpc<GetAccountInfoApi & GetProgramAccountsApi>;

async function fetchAndDecode<T>(
  rpc: FetchRpc,
  address: Address,
  parser: (data: Uint8Array) => T,
): Promise<T | null> {
  const account = await fetchEncodedAccount(rpc, address);
  if (!account.exists) return null;
  return parser(new Uint8Array(account.data));
}

export async function fetchConfig(rpc: FetchRpc): Promise<ParsedConfig | null> {
  const [address] = await getConfigPda();
  return fetchAndDecode(rpc, address, parseConfig);
}

export async function fetchBasket(
  rpc: FetchRpc,
  basketId: bigint,
): Promise<ParsedBasket | null> {
  const [address] = await getBasketPda(basketId);
  return fetchAndDecode(rpc, address, parseBasket);
}

export async function fetchBasketToken(
  rpc: FetchRpc,
  basket: Address,
  mint: Address,
): Promise<ParsedBasketToken | null> {
  const [address] = await getBasketTokenPda(basket, mint);
  return fetchAndDecode(rpc, address, parseBasketToken);
}

export async function fetchUserAllowList(
  rpc: FetchRpc,
  basket: Address,
  user: Address,
): Promise<ParsedUserAllowList | null> {
  const [address] = await getUserAllowListPda(basket, user);
  return fetchAndDecode(rpc, address, parseUserAllowList);
}

export async function fetchAllBaskets(rpc: FetchRpc): Promise<ParsedBasket[]> {
  const addressEncoder = getAddressEncoder();
  const accounts = await rpc
    .getProgramAccounts(PROGRAM_ID, {
      encoding: "base64",
      filters: [
        {
          memcmp: {
            offset: 0n,
            bytes: Buffer.from(DISCRIMINATORS.basket).toString("base64"),
            encoding: "base64",
          },
        },
      ],
    })
    .send();

  return accounts.map((a) => {
    const data =
      typeof a.account.data === "string"
        ? Buffer.from(a.account.data, "base64")
        : a.account.data instanceof Uint8Array
          ? a.account.data
          : Buffer.from(a.account.data[0], "base64");
    return parseBasket(new Uint8Array(data));
  });
}

export async function fetchAllBasketTokens(
  rpc: FetchRpc,
  basket: Address,
): Promise<ParsedBasketToken[]> {
  const addressEncoder = getAddressEncoder();
  const accounts = await rpc
    .getProgramAccounts(PROGRAM_ID, {
      encoding: "base64",
      filters: [
        {
          memcmp: {
            offset: 0n,
            bytes: Buffer.from(DISCRIMINATORS.basketToken).toString("base64"),
            encoding: "base64",
          },
        },
        {
          memcmp: {
            offset: BigInt(DISCRIMINATOR_SIZE),
            bytes: Buffer.from(addressEncoder.encode(basket)).toString("base64"),
            encoding: "base64",
          },
        },
      ],
    })
    .send();

  return accounts.map((a) => {
    const data =
      typeof a.account.data === "string"
        ? Buffer.from(a.account.data, "base64")
        : a.account.data instanceof Uint8Array
          ? a.account.data
          : Buffer.from(a.account.data[0], "base64");
    return parseBasketToken(new Uint8Array(data));
  });
}
```

**Step 2: Commit**

```bash
git add lib/solana/accounts.ts
git commit -m "feat: add typed account fetching functions"
```

---

### Task 6: Instructions — Admin (init-config, set-config, create-basket, add-tokens)

**Files:**
- Create: `lib/solana/instructions/init-config.ts`
- Create: `lib/solana/instructions/set-config.ts`
- Create: `lib/solana/instructions/create-basket.ts`
- Create: `lib/solana/instructions/add-tokens.ts`

**Step 1: Write init-config instruction**

```ts
import {
  type Address,
  type IInstruction,
  AccountRole,
  getAddressEncoder,
  getU16Codec,
  getBooleanCodec,
  getAddressCodec,
} from "@solana/kit";
import { PROGRAM_ID, SYSTEM_PROGRAM_ID, IX_DISCRIMINATORS } from "../constants";
import { getConfigPda, getEventAuthorityPda } from "../pdas";

export async function buildInitConfigIx(
  payer: Address,
  feeBps: number,
  whitelistAuth: Address,
  complianceEnabled: boolean,
): Promise<IInstruction> {
  const [configAddress] = await getConfigPda();
  const [eventAuthority] = await getEventAuthorityPda();

  const u16 = getU16Codec();
  const bool = getBooleanCodec();
  const addr = getAddressCodec();

  const data = new Uint8Array([
    ...IX_DISCRIMINATORS.initConfig,
    ...u16.encode(feeBps),
    ...addr.encode(whitelistAuth),
    ...bool.encode(complianceEnabled),
  ]);

  return {
    programAddress: PROGRAM_ID,
    accounts: [
      { address: payer, role: AccountRole.WRITABLE_SIGNER },
      { address: configAddress, role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
      { address: eventAuthority, role: AccountRole.READONLY },
      { address: PROGRAM_ID, role: AccountRole.READONLY },
    ],
    data,
  };
}
```

**Step 2: Write set-config instruction**

```ts
import {
  type Address,
  type IInstruction,
  AccountRole,
  getU16Codec,
  getBooleanCodec,
  getAddressCodec,
} from "@solana/kit";
import { PROGRAM_ID, IX_DISCRIMINATORS } from "../constants";
import { getConfigPda, getEventAuthorityPda } from "../pdas";

function encodeOption<T>(
  value: T | null,
  encode: (v: T) => Uint8Array,
): Uint8Array {
  if (value === null) return new Uint8Array([0]);
  return new Uint8Array([1, ...encode(value)]);
}

export async function buildSetConfigIx(
  payer: Address,
  feeBps: number | null = null,
  whitelistAuth: Address | null = null,
  complianceEnabled: boolean | null = null,
  newAdmin: Address | null = null,
): Promise<IInstruction> {
  const [configAddress] = await getConfigPda();
  const [eventAuthority] = await getEventAuthorityPda();

  const u16 = getU16Codec();
  const bool = getBooleanCodec();
  const addr = getAddressCodec();

  const data = new Uint8Array([
    ...IX_DISCRIMINATORS.setConfig,
    ...encodeOption(feeBps, (v) => new Uint8Array(u16.encode(v))),
    ...encodeOption(whitelistAuth, (v) => new Uint8Array(addr.encode(v))),
    ...encodeOption(complianceEnabled, (v) => new Uint8Array(bool.encode(v))),
    ...encodeOption(newAdmin, (v) => new Uint8Array(addr.encode(v))),
  ]);

  return {
    programAddress: PROGRAM_ID,
    accounts: [
      { address: payer, role: AccountRole.READONLY_SIGNER },
      { address: configAddress, role: AccountRole.WRITABLE },
      { address: eventAuthority, role: AccountRole.READONLY },
      { address: PROGRAM_ID, role: AccountRole.READONLY },
    ],
    data,
  };
}
```

**Step 3: Write create-basket instruction**

```ts
import {
  type Address,
  type IInstruction,
  AccountRole,
  getU64Codec,
  getU16Codec,
} from "@solana/kit";
import { PROGRAM_ID, SYSTEM_PROGRAM_ID, TOKEN_PROGRAM_ID, IX_DISCRIMINATORS, MAX_NAME_LEN } from "../constants";
import {
  getConfigPda,
  getBasketPda,
  getVaultAuthorityPda,
  getMintAuthorityPda,
  getEventAuthorityPda,
} from "../pdas";

function encodeOption16(value: number | null): Uint8Array {
  if (value === null) return new Uint8Array([0]);
  const u16 = getU16Codec();
  return new Uint8Array([1, ...u16.encode(value)]);
}

function encodeName(name: string): Uint8Array {
  const buf = new Uint8Array(MAX_NAME_LEN);
  const encoded = new TextEncoder().encode(name.slice(0, MAX_NAME_LEN));
  buf.set(encoded);
  return buf;
}

export async function buildCreateBasketIx(
  payer: Address,
  basketId: bigint,
  name: string,
  shareMintAddress: Address,
  tokenProgram: Address = TOKEN_PROGRAM_ID,
  feeBpsOverride: number | null = null,
): Promise<IInstruction> {
  const [configAddress] = await getConfigPda();
  const [basketAddress] = await getBasketPda(basketId);
  const [vaultAuthority] = await getVaultAuthorityPda(basketId);
  const [mintAuthority] = await getMintAuthorityPda(basketId);
  const [eventAuthority] = await getEventAuthorityPda();

  const u64 = getU64Codec();
  const data = new Uint8Array([
    ...IX_DISCRIMINATORS.createBasket,
    ...u64.encode(basketId),
    ...encodeName(name),
    ...encodeOption16(feeBpsOverride),
  ]);

  return {
    programAddress: PROGRAM_ID,
    accounts: [
      { address: payer, role: AccountRole.WRITABLE_SIGNER },
      { address: configAddress, role: AccountRole.READONLY },
      { address: basketAddress, role: AccountRole.WRITABLE },
      { address: vaultAuthority, role: AccountRole.READONLY },
      { address: mintAuthority, role: AccountRole.READONLY },
      { address: shareMintAddress, role: AccountRole.WRITABLE_SIGNER },
      { address: tokenProgram, role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
      { address: eventAuthority, role: AccountRole.READONLY },
      { address: PROGRAM_ID, role: AccountRole.READONLY },
    ],
    data,
  };
}
```

**Step 4: Write add-tokens instruction**

```ts
import {
  type Address,
  type IInstruction,
  AccountRole,
} from "@solana/kit";
import {
  PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  IX_DISCRIMINATORS,
} from "../constants";
import {
  getConfigPda,
  getBasketTokenPda,
  getFeeVaultPda,
  getEventAuthorityPda,
  getAssociatedTokenAddress,
} from "../pdas";

export async function buildAddTokensIx(
  payer: Address,
  basketAddress: Address,
  underlyingMint: Address,
  vaultAuthority: Address,
  tokenProgram: Address = TOKEN_PROGRAM_ID,
): Promise<IInstruction> {
  const [configAddress] = await getConfigPda();
  const [basketTokenAddress] = await getBasketTokenPda(basketAddress, underlyingMint);
  const [feeVaultAddress] = await getFeeVaultPda(basketAddress, underlyingMint);
  const [vaultAta] = await getAssociatedTokenAddress(vaultAuthority, tokenProgram, underlyingMint);
  const [eventAuthority] = await getEventAuthorityPda();

  return {
    programAddress: PROGRAM_ID,
    accounts: [
      { address: payer, role: AccountRole.WRITABLE_SIGNER },
      { address: configAddress, role: AccountRole.READONLY },
      { address: basketAddress, role: AccountRole.WRITABLE },
      { address: underlyingMint, role: AccountRole.READONLY },
      { address: vaultAuthority, role: AccountRole.READONLY },
      { address: basketTokenAddress, role: AccountRole.WRITABLE },
      { address: vaultAta, role: AccountRole.WRITABLE },
      { address: feeVaultAddress, role: AccountRole.WRITABLE },
      { address: tokenProgram, role: AccountRole.READONLY },
      { address: ASSOCIATED_TOKEN_PROGRAM_ID, role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
      { address: eventAuthority, role: AccountRole.READONLY },
      { address: PROGRAM_ID, role: AccountRole.READONLY },
    ],
    data: new Uint8Array([...IX_DISCRIMINATORS.addTokens]),
  };
}
```

**Step 5: Commit**

```bash
git add lib/solana/instructions/
git commit -m "feat: add admin instruction builders"
```

---

### Task 7: Instructions — User (deposit-multi, withdraw-multi, update-allow-list)

**Files:**
- Create: `lib/solana/instructions/deposit-multi.ts`
- Create: `lib/solana/instructions/withdraw-multi.ts`
- Create: `lib/solana/instructions/update-allow-list.ts`

**Step 1: Write deposit-multi instruction**

Remaining accounts per token: [BasketToken, Mint, UserATA, VaultATA, FeeVaultATA]

```ts
import {
  type Address,
  type IInstruction,
  AccountRole,
  getU64Codec,
  getU32Codec,
} from "@solana/kit";
import {
  PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  IX_DISCRIMINATORS,
} from "../constants";
import {
  getConfigPda,
  getMintAuthorityPda,
  getBasketTokenPda,
  getFeeVaultPda,
  getEventAuthorityPda,
  getAssociatedTokenAddress,
} from "../pdas";

export async function buildDepositMultiIx(
  payer: Address,
  basketAddress: Address,
  basketId: bigint,
  shareMint: Address,
  amounts: bigint[],
  tokenMints: Address[],
  vaultAuthority: Address,
  tokenProgram: Address = TOKEN_PROGRAM_ID,
  userAllowList: Address | null = null,
): Promise<IInstruction> {
  const [configAddress] = await getConfigPda();
  const [mintAuthority] = await getMintAuthorityPda(basketId);
  const [userShareAta] = await getAssociatedTokenAddress(payer, tokenProgram, shareMint);
  const [eventAuthority] = await getEventAuthorityPda();

  const u64 = getU64Codec();
  const u32 = getU32Codec();
  const amountsData = new Uint8Array([
    ...u32.encode(amounts.length),
    ...amounts.flatMap((a) => [...u64.encode(a)]),
  ]);

  const data = new Uint8Array([...IX_DISCRIMINATORS.depositMulti, ...amountsData]);

  const accounts = [
    { address: payer, role: AccountRole.WRITABLE_SIGNER },
    { address: configAddress, role: AccountRole.READONLY },
    { address: basketAddress, role: AccountRole.READONLY },
    { address: mintAuthority, role: AccountRole.READONLY },
    { address: shareMint, role: AccountRole.WRITABLE },
    { address: userShareAta, role: AccountRole.WRITABLE },
    ...(userAllowList
      ? [{ address: userAllowList, role: AccountRole.READONLY as const }]
      : []),
    { address: tokenProgram, role: AccountRole.READONLY },
    { address: ASSOCIATED_TOKEN_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: eventAuthority, role: AccountRole.READONLY },
    { address: PROGRAM_ID, role: AccountRole.READONLY },
  ];

  const remaining: { address: Address; role: AccountRole }[] = [];
  for (let i = 0; i < tokenMints.length; i++) {
    const mint = tokenMints[i];
    const [basketTokenPda] = await getBasketTokenPda(basketAddress, mint);
    const [userAta] = await getAssociatedTokenAddress(payer, tokenProgram, mint);
    const [vaultAta] = await getAssociatedTokenAddress(vaultAuthority, tokenProgram, mint);
    const [feeVault] = await getFeeVaultPda(basketAddress, mint);

    remaining.push(
      { address: basketTokenPda, role: AccountRole.READONLY },
      { address: mint, role: AccountRole.READONLY },
      { address: userAta, role: AccountRole.WRITABLE },
      { address: vaultAta, role: AccountRole.WRITABLE },
      { address: feeVault, role: AccountRole.WRITABLE },
    );
  }

  return {
    programAddress: PROGRAM_ID,
    accounts: [...accounts, ...remaining],
    data,
  };
}
```

**Step 2: Write withdraw-multi instruction**

Remaining accounts per token: [BasketToken, Mint, VaultATA, UserATA]

```ts
import {
  type Address,
  type IInstruction,
  AccountRole,
  getU64Codec,
} from "@solana/kit";
import {
  PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  IX_DISCRIMINATORS,
} from "../constants";
import {
  getConfigPda,
  getBasketTokenPda,
  getEventAuthorityPda,
  getAssociatedTokenAddress,
} from "../pdas";

export async function buildWithdrawMultiIx(
  payer: Address,
  basketAddress: Address,
  shareMint: Address,
  vaultAuthority: Address,
  sharesToBurn: bigint,
  tokenMints: Address[],
  tokenProgram: Address = TOKEN_PROGRAM_ID,
): Promise<IInstruction> {
  const [configAddress] = await getConfigPda();
  const [userShareAta] = await getAssociatedTokenAddress(payer, tokenProgram, shareMint);
  const [eventAuthority] = await getEventAuthorityPda();

  const u64 = getU64Codec();
  const data = new Uint8Array([...IX_DISCRIMINATORS.withdrawMulti, ...u64.encode(sharesToBurn)]);

  const accounts = [
    { address: payer, role: AccountRole.WRITABLE_SIGNER },
    { address: configAddress, role: AccountRole.READONLY },
    { address: basketAddress, role: AccountRole.READONLY },
    { address: shareMint, role: AccountRole.WRITABLE },
    { address: userShareAta, role: AccountRole.WRITABLE },
    { address: vaultAuthority, role: AccountRole.READONLY },
    { address: tokenProgram, role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: eventAuthority, role: AccountRole.READONLY },
    { address: PROGRAM_ID, role: AccountRole.READONLY },
  ];

  const remaining: { address: Address; role: AccountRole }[] = [];
  for (let i = 0; i < tokenMints.length; i++) {
    const mint = tokenMints[i];
    const [basketTokenPda] = await getBasketTokenPda(basketAddress, mint);
    const [vaultAta] = await getAssociatedTokenAddress(vaultAuthority, tokenProgram, mint);
    const [userAta] = await getAssociatedTokenAddress(payer, tokenProgram, mint);

    remaining.push(
      { address: basketTokenPda, role: AccountRole.READONLY },
      { address: mint, role: AccountRole.READONLY },
      { address: vaultAta, role: AccountRole.WRITABLE },
      { address: userAta, role: AccountRole.WRITABLE },
    );
  }

  return {
    programAddress: PROGRAM_ID,
    accounts: [...accounts, ...remaining],
    data,
  };
}
```

**Step 3: Write update-allow-list instruction**

```ts
import {
  type Address,
  type IInstruction,
  AccountRole,
  getBooleanCodec,
} from "@solana/kit";
import { PROGRAM_ID, SYSTEM_PROGRAM_ID, IX_DISCRIMINATORS } from "../constants";
import { getConfigPda, getUserAllowListPda, getEventAuthorityPda } from "../pdas";

export async function buildUpdateAllowListIx(
  authority: Address,
  basketAddress: Address,
  userAddress: Address,
  allowed: boolean,
): Promise<IInstruction> {
  const [configAddress] = await getConfigPda();
  const [userAllowListAddress] = await getUserAllowListPda(basketAddress, userAddress);
  const [eventAuthority] = await getEventAuthorityPda();

  const bool = getBooleanCodec();
  const data = new Uint8Array([...IX_DISCRIMINATORS.updateAllowList, ...bool.encode(allowed)]);

  return {
    programAddress: PROGRAM_ID,
    accounts: [
      { address: authority, role: AccountRole.WRITABLE_SIGNER },
      { address: configAddress, role: AccountRole.READONLY },
      { address: basketAddress, role: AccountRole.READONLY },
      { address: userAddress, role: AccountRole.READONLY },
      { address: userAllowListAddress, role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
      { address: eventAuthority, role: AccountRole.READONLY },
      { address: PROGRAM_ID, role: AccountRole.READONLY },
    ],
    data,
  };
}
```

**Step 4: Commit**

```bash
git add lib/solana/instructions/
git commit -m "feat: add user instruction builders (deposit, withdraw, allow-list)"
```

---

### Task 8: Instructions Index

**Files:**
- Create: `lib/solana/instructions/index.ts`

**Step 1: Write barrel export**

```ts
export { buildInitConfigIx } from "./init-config";
export { buildSetConfigIx } from "./set-config";
export { buildCreateBasketIx } from "./create-basket";
export { buildAddTokensIx } from "./add-tokens";
export { buildDepositMultiIx } from "./deposit-multi";
export { buildWithdrawMultiIx } from "./withdraw-multi";
export { buildUpdateAllowListIx } from "./update-allow-list";
```

**Step 2: Commit**

```bash
git add lib/solana/instructions/index.ts
git commit -m "feat: add instructions barrel export"
```

---

### Task 9: Transactions

**Files:**
- Create: `lib/solana/transactions.ts`

**Step 1: Write transactions file**

Uses Kit's pipe pattern for transaction message construction, `compileTransaction` for V0 compile, and `sendAndConfirmTransactionFactory` for the full lifecycle.

```ts
import {
  type Address,
  type IInstruction,
  type Rpc,
  type RpcSubscriptions,
  type GetLatestBlockhashApi,
  type GetEpochInfoApi,
  type GetSignatureStatusesApi,
  type SendTransactionApi,
  type SignatureNotificationsApi,
  type SlotNotificationsApi,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  compileTransaction,
  signTransaction,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
} from "@solana/kit";

type TransactionRpc = Rpc<
  GetLatestBlockhashApi & GetEpochInfoApi & GetSignatureStatusesApi & SendTransactionApi
>;
type TransactionRpcSubscriptions = RpcSubscriptions<
  SignatureNotificationsApi & SlotNotificationsApi
>;

export async function buildTransaction(
  rpc: TransactionRpc,
  instructions: IInstruction[],
  payer: Address,
) {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (msg) => setTransactionMessageFeePayer(payer, msg),
    (msg) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, msg),
    (msg) => appendTransactionMessageInstructions(instructions, msg),
  );

  return {
    transaction: compileTransaction(message),
    latestBlockhash,
  };
}

export async function buildAndSendTransaction(
  rpc: TransactionRpc,
  rpcSubscriptions: TransactionRpcSubscriptions,
  instructions: IInstruction[],
  payer: Address,
  signTx: (tx: Parameters<typeof signTransaction>[1]) => Promise<ReturnType<typeof signTransaction>>,
  keyPairs?: CryptoKeyPair[],
) {
  const { transaction, latestBlockhash } = await buildTransaction(rpc, instructions, payer);

  let signed;
  if (keyPairs && keyPairs.length > 0) {
    signed = await signTransaction(keyPairs, transaction);
  } else {
    signed = await signTx(transaction);
  }

  const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
  await sendAndConfirm(signed, { commitment: "confirmed" });

  return getSignatureFromTransaction(signed);
}
```

**Step 2: Commit**

```bash
git add lib/solana/transactions.ts
git commit -m "feat: add transaction build and send helpers"
```

---

### Task 10: TypeScript verification

**Step 1: Run type check**

Run: `bunx tsc --noEmit --pretty`
Expected: No type errors in `lib/solana/` files.

**Step 2: Fix any type errors found**

Iterate on any issues until clean.

**Step 3: Final commit if fixes needed**

```bash
git add lib/solana/
git commit -m "fix: resolve type errors in Solana SDK"
```
