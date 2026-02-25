use anchor_lang::prelude::*;
use static_assertions::const_assert_eq;

/// Per-mint whitelist entry for a basket.
#[account]
#[derive(InitSpace)]
pub struct BasketToken {
    pub basket: Pubkey,
    pub mint: Pubkey,
    pub vault_ata: Pubkey,
    pub fee_vault_ata: Pubkey,
    pub decimals: u8,
    pub enabled: bool,
    pub bump: u8,
}

const_assert_eq!(BasketToken::INIT_SPACE, 131);
