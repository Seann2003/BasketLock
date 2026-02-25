use anchor_lang::prelude::*;
use static_assertions::const_assert_eq;

/// Global protocol configuration
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub whitelist_auth: Pubkey,
    pub fee_bps: u16,
    pub compliance_enabled: bool,
    pub version: u8,
    pub bump: u8,
}

const_assert_eq!(Config::INIT_SPACE, 69);
