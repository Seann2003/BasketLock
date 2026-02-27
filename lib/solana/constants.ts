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
