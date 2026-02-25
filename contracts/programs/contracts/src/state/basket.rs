use anchor_lang::prelude::*;
use static_assertions::const_assert_eq;

use crate::constants::MAX_NAME_LEN;

// Per-basket state account using zero-copy deserialization.
#[account(zero_copy)]
#[repr(C)]
pub struct Basket {
    pub owner: Pubkey,
    pub share_mint: Pubkey,
    pub vault_authority: Pubkey,
    pub basket_id: u64,
    pub name: [u8; MAX_NAME_LEN],
    pub fee_bps_override: u16,
    pub has_fee_override: u8,
    pub token_count: u8,
    pub version: u8,
    pub basket_bump: u8,
    pub vault_authority_bump: u8,
    pub mint_authority_bump: u8,
}

const_assert_eq!(std::mem::size_of::<Basket>(), 144);

impl Basket {
    pub fn effective_fee_bps(&self, global_fee_bps: u16) -> u16 {
        if self.has_fee_override == 1 {
            self.fee_bps_override
        } else {
            global_fee_bps
        }
    }
}
