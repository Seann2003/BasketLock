use anchor_lang::prelude::*;
use static_assertions::const_assert_eq;

/// Per-user compliance gate for a specific basket.
#[account]
#[derive(InitSpace)]
pub struct UserAllowList {
    pub basket: Pubkey,
    pub user: Pubkey,
    pub allowed: bool,
    pub bump: u8,
}

const_assert_eq!(UserAllowList::INIT_SPACE, 66);
