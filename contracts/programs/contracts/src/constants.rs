// PDA Seeds 
pub const CONFIG_SEED: &[u8] = b"config";
pub const BASKET_SEED: &[u8] = b"basket";
pub const BASKET_TOKEN_SEED: &[u8] = b"basket_token";
pub const VAULT_AUTHORITY_SEED: &[u8] = b"vault_authority";
pub const MINT_AUTHORITY_SEED: &[u8] = b"mint_authority";
pub const FEE_VAULT_SEED: &[u8] = b"fee_vault";
pub const USER_ALLOW_SEED: &[u8] = b"user_allow";

// Fee bounds (basis points) 
pub const FEE_BPS_MIN: u16 = 10;
pub const FEE_BPS_MAX: u16 = 50;
pub const BPS_DENOMINATOR: u64 = 10_000;

// Protocol limits
pub const MAX_TOKENS_PER_BASKET: u8 = 10;
pub const MAX_NAME_LEN: usize = 32;

// QSHARE token config
pub const QSHARE_DECIMALS: u8 = 6;

// Protocol version
pub const CURRENT_VERSION: u8 = 1;

// Remaining accounts layout sizes 
/// deposit_multi: [BasketToken, Mint, UserATA, VaultATA, FeeVaultATA] per token
pub const DEPOSIT_ACCOUNTS_PER_TOKEN: usize = 5;
/// withdraw_multi: [BasketToken, Mint, VaultATA, UserATA] per token
pub const WITHDRAW_ACCOUNTS_PER_TOKEN: usize = 4;
