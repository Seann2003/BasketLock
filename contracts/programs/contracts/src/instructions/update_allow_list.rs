use anchor_lang::prelude::*;

use crate::{constants::*, error::BasketError, events::*, state::*};

#[event_cpi]
#[derive(Accounts)]
pub struct UpdateAllowList<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = config.whitelist_auth == authority.key() @ BasketError::Unauthorized,
    )]
    pub config: Box<Account<'info, Config>>,

    pub basket: AccountLoader<'info, Basket>,

    /// CHECK: The user being allow-listed — no signature required.
    pub user: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + UserAllowList::INIT_SPACE,
        seeds = [
            USER_ALLOW_SEED,
            basket.key().as_ref(),
            user.key().as_ref(),
        ],
        bump,
    )]
    pub user_allow_list: Box<Account<'info, UserAllowList>>,

    pub system_program: Program<'info, System>,
}

impl<'info> UpdateAllowList<'info> {
    pub fn handler(ctx: Context<UpdateAllowList>, allowed: bool) -> Result<()> {
        ctx.accounts.user_allow_list.set_inner(UserAllowList {
            basket: ctx.accounts.basket.key(),
            user: ctx.accounts.user.key(),
            allowed,
            bump: ctx.bumps.user_allow_list,
        });

        emit_cpi!(AllowListUpdated {
            basket: ctx.accounts.basket.key(),
            user: ctx.accounts.user.key(),
            allowed,
        });

        Ok(())
    }
}
