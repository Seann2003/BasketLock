import {
  type Address,
  type Instruction,
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
): Promise<Instruction> {
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
