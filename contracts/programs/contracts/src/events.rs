use anchor_lang::prelude::*;

#[event]
pub struct ConfigInitialized {
    pub admin: Pubkey,
    pub whitelist_auth: Pubkey,
    pub fee_bps: u16,
    pub compliance_enabled: bool,
}

#[event]
pub struct ConfigUpdated {
    pub fee_bps: u16,
    pub whitelist_auth: Pubkey,
    pub compliance_enabled: bool,
    pub new_admin: Pubkey,
}

#[event]
pub struct AllowListUpdated {
    pub basket: Pubkey,
    pub user: Pubkey,
    pub allowed: bool,
}

#[event]
pub struct BasketCreated {
    pub basket_id: u64,
    pub owner: Pubkey,
    pub share_mint: Pubkey,
}

#[event]
pub struct TokenAdded {
    pub basket: Pubkey,
    pub mint: Pubkey,
    pub vault_ata: Pubkey,
}

#[event]
pub struct DepositCompleted {
    pub basket: Pubkey,
    pub user: Pubkey,
    pub shares_minted: u64,
}

#[event]
pub struct WithdrawCompleted {
    pub basket: Pubkey,
    pub user: Pubkey,
    pub shares_burned: u64,
}
