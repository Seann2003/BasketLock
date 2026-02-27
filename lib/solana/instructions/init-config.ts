import {
  type Address,
  type IInstruction,
  AccountRole,
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
