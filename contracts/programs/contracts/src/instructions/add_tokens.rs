use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{constants::*, error::BasketError, state::*};

#[derive(Accounts)]
pub struct AddTokens<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ BasketError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub basket: AccountLoader<'info, Basket>,

    /// The underlying SPL token mint being registered.
    pub underlying_mint: InterfaceAccount<'info, Mint>,

    /// Vault authority PDA — validated against the stored bump in the handler.
    /// CHECK: Validated in handler against basket.vault_authority.
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + BasketToken::INIT_SPACE,
        seeds = [
            BASKET_TOKEN_SEED,
            basket.key().as_ref(),
            underlying_mint.key().as_ref(),
        ],
        bump,
    )]
    pub basket_token: Account<'info, BasketToken>,

    /// Vault ATA for this mint (owned by vault_authority).
    #[account(
        init,
        payer = admin,
        associated_token::mint = underlying_mint,
        associated_token::authority = vault_authority,
        associated_token::token_program = token_program,
    )]
    pub vault_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = admin,
        token::mint = underlying_mint,
        token::authority = vault_authority,
        seeds = [
            FEE_VAULT_SEED,
            basket.key().as_ref(),
            underlying_mint.key().as_ref(),
        ],
        bump,
    )]
    pub fee_vault_ata: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> AddTokens<'info> {
    pub fn handler(&mut self, bumps: &AddTokensBumps) -> Result<()> {
        let mut basket = self.basket.load_mut()?;

        require!(
            self.vault_authority.key() == basket.vault_authority,
            BasketError::VaultAuthMismatch
        );
        require!(
            basket.token_count < MAX_TOKENS_PER_BASKET,
            BasketError::MaxTokensExceeded
        );

        basket.token_count = basket
            .token_count
            .checked_add(1)
            .ok_or(BasketError::ArithmeticOverflow)?;

        // Drop the borrow before writing to basket_token (same tx scope)
        drop(basket);

        self.basket_token.set_inner(BasketToken {
            basket: self.basket.key(),
            mint: self.underlying_mint.key(),
            vault_ata: self.vault_ata.key(),
            fee_vault_ata: self.fee_vault_ata.key(),
            decimals: self.underlying_mint.decimals,
            enabled: true,
            bump: bumps.basket_token,
        });

        Ok(())
    }
}
