import type { Address, Rpc, GetAccountInfoApi, GetProgramAccountsApi, Base64EncodedBytes } from "@solana/kit";
import { fetchEncodedAccount, getAddressEncoder } from "@solana/kit";
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

function extractAccountData(account: { data: unknown }): Uint8Array {
  const d = account.data;
  if (d instanceof Uint8Array) return d;
  if (typeof d === "string") return new Uint8Array(Buffer.from(d, "base64"));
  if (Array.isArray(d)) return new Uint8Array(Buffer.from(d[0] as string, "base64"));
  return new Uint8Array(d as ArrayBuffer);
}

export async function fetchAllBaskets(rpc: FetchRpc): Promise<ParsedBasket[]> {
  const accounts = await rpc
    .getProgramAccounts(PROGRAM_ID, {
      encoding: "base64",
      filters: [
        {
          memcmp: {
            offset: BigInt(0),
            bytes: Buffer.from(DISCRIMINATORS.basket).toString("base64") as Base64EncodedBytes,
            encoding: "base64",
          },
        },
      ],
    })
    .send();

  return (accounts as unknown as { account: { data: unknown } }[]).map((a) =>
    parseBasket(extractAccountData(a.account)),
  );
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
            offset: BigInt(0),
            bytes: Buffer.from(DISCRIMINATORS.basketToken).toString("base64") as Base64EncodedBytes,
            encoding: "base64",
          },
        },
        {
          memcmp: {
            offset: BigInt(DISCRIMINATOR_SIZE),
            bytes: Buffer.from(addressEncoder.encode(basket)).toString("base64") as Base64EncodedBytes,
            encoding: "base64",
          },
        },
      ],
    })
    .send();

  return (accounts as unknown as { account: { data: unknown } }[]).map((a) =>
    parseBasketToken(extractAccountData(a.account)),
  );
}
