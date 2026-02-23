use anchor_lang::prelude::*;

use crate::{constants::*, error::BasketError, state::*};

#[derive(Accounts)]
pub struct UpdateAllowList<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = config.whitelist_auth == authority.key() @ BasketError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    pub basket: AccountLoader<'info, Basket>,

    /// CHECK: The user being allow-listed — no signature required.
    pub user: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + UserAllowList::INIT_SPACE,
        seeds = [
            USER_ALLOW_SEED,
            basket.key().as_ref(),
            user.key().as_ref(),
        ],
        bump,
    )]
    pub user_allow_list: Account<'info, UserAllowList>,

    pub system_program: Program<'info, System>,
}

impl<'info> UpdateAllowList<'info> {
    pub fn handler(&mut self, allowed: bool, bumps: &UpdateAllowListBumps) -> Result<()> {
        self.user_allow_list.set_inner(UserAllowList {
            basket: self.basket.key(),
            user: self.user.key(),
            allowed,
            bump: bumps.user_allow_list,
        });

        Ok(())
    }
}
