export interface Token {
  symbol: string;
  name: string;
  amount: number;
  decimals: number;
}

export interface VestingSchedule {
  startDate: Date;
  endDate: Date;
  cliffDate: Date;
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  totalAmount: number;
  claimedAmount: number;
}

export type VaultStatus = "active" | "locked" | "completed";

export interface Vault {
  id: string;
  name: string;
  description: string;
  status: VaultStatus;
  tokens: Token[];
  vestingSchedule: VestingSchedule;
  totalValueUSD: number;
  createdAt: Date;
  updatedAt: Date;
  owner: string;
  isMultisig: boolean;
  signers?: string[];
  threshold?: number;
}

export interface Claim {
  id: string;
  vaultId: string;
  token: Token;
  amount: number;
  timestamp: Date;
  txHash: string;
}
