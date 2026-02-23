use anchor_lang::prelude::*;

/// Per-user compliance gate for a specific basket.
#[account]
#[derive(InitSpace)]
pub struct UserAllowList {
    pub basket: Pubkey,
    pub user: Pubkey,
    pub allowed: bool,
    pub bump: u8,
}
