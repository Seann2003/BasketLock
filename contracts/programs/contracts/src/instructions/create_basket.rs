use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::{constants::*, error::BasketError, state::*};

#[derive(Accounts)]
#[instruction(basket_id: u64)]
pub struct CreateBasket<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ BasketError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = admin,
        space = 8 + std::mem::size_of::<Basket>(),
        seeds = [BASKET_SEED, basket_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub basket: AccountLoader<'info, Basket>,

    /// Vault authority PDA — owns all vault token accounts for this basket.
    /// CHECK: Validated by seeds constraint.
    #[account(
        seeds = [VAULT_AUTHORITY_SEED, basket_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    /// Mint authority PDA — QSHARE mint authority for this basket.
    /// CHECK: Validated by seeds constraint.
    #[account(
        seeds = [MINT_AUTHORITY_SEED, basket_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub mint_authority: UncheckedAccount<'info>,

    /// The QSHARE SPL mint, created here under program control.
    #[account(
        init,
        payer = admin,
        mint::decimals = QSHARE_DECIMALS,
        mint::authority = mint_authority,
        mint::token_program = token_program,
    )]
    pub share_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateBasket<'info> {
    pub fn handler(
        &mut self,
        basket_id: u64,
        name: &[u8; MAX_NAME_LEN],
        fee_bps_override: Option<u16>,
        bumps: &CreateBasketBumps,
    ) -> Result<()> {
        if let Some(bps) = fee_bps_override {
            require!(
                (FEE_BPS_MIN..=FEE_BPS_MAX).contains(&bps),
                BasketError::InvalidFee
            );
        }

        let mut basket = self.basket.load_init()?;
        basket.owner = self.admin.key();
        basket.share_mint = self.share_mint.key();
        basket.vault_authority = self.vault_authority.key();
        basket.basket_id = basket_id;
        basket.name = *name;
        basket.fee_bps_override = fee_bps_override.unwrap_or(0);
        basket.has_fee_override = u8::from(fee_bps_override.is_some());
        basket.token_count = 0;
        basket.version = CURRENT_VERSION;
        basket.basket_bump = bumps.basket;
        basket.vault_authority_bump = bumps.vault_authority;
        basket.mint_authority_bump = bumps.mint_authority;

        Ok(())
    }
}
