use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{constants::*, error::BasketError, events::*, state::*};

#[event_cpi]
#[derive(Accounts)]
pub struct AddTokens<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ BasketError::Unauthorized,
    )]
    pub config: Box<Account<'info, Config>>,

    #[account(mut)]
    pub basket: AccountLoader<'info, Basket>,

    /// The underlying SPL token mint being registered.
    pub underlying_mint: Box<InterfaceAccount<'info, Mint>>,

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
    pub basket_token: Box<Account<'info, BasketToken>>,

    /// Vault ATA for this mint (owned by vault_authority).
    #[account(
        init,
        payer = admin,
        associated_token::mint = underlying_mint,
        associated_token::authority = vault_authority,
        associated_token::token_program = token_program,
    )]
    pub vault_ata: Box<InterfaceAccount<'info, TokenAccount>>,

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
    pub fee_vault_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> AddTokens<'info> {
    pub fn handler(ctx: Context<AddTokens>) -> Result<()> {
        let mut basket = ctx.accounts.basket.load_mut()?;

        require!(
            ctx.accounts.vault_authority.key() == basket.vault_authority,
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

        ctx.accounts.basket_token.set_inner(BasketToken {
            basket: ctx.accounts.basket.key(),
            mint: ctx.accounts.underlying_mint.key(),
            vault_ata: ctx.accounts.vault_ata.key(),
            fee_vault_ata: ctx.accounts.fee_vault_ata.key(),
            decimals: ctx.accounts.underlying_mint.decimals,
            enabled: true,
            bump: ctx.bumps.basket_token,
        });

        emit_cpi!(TokenAdded {
            basket: ctx.accounts.basket.key(),
            mint: ctx.accounts.underlying_mint.key(),
            vault_ata: ctx.accounts.vault_ata.key(),
        });

        Ok(())
    }
}
