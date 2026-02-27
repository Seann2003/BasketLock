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
  codec: { read: (bytes: Uint8Array, offset: number) => [T, number] },
  data: Uint8Array,
): T {
  const [decoded] = codec.read(data, DISCRIMINATOR_SIZE);
  return decoded;
}
