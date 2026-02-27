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
