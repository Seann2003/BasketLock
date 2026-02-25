use anchor_lang::prelude::*;

use crate::{constants::*, error::BasketError, events::*, state::Config};

#[event_cpi]
#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Box<Account<'info, Config>>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitConfig<'info> {
    pub fn handler(
        ctx: Context<InitConfig>,
        fee_bps: u16,
        whitelist_auth: Pubkey,
        compliance_enabled: bool,
    ) -> Result<()> {
        require!(
            (FEE_BPS_MIN..=FEE_BPS_MAX).contains(&fee_bps),
            BasketError::InvalidFee
        );

        ctx.accounts.config.set_inner(Config {
            admin: ctx.accounts.admin.key(),
            whitelist_auth,
            fee_bps,
            compliance_enabled,
            version: CURRENT_VERSION,
            bump: ctx.bumps.config,
        });

        emit_cpi!(ConfigInitialized {
            admin: ctx.accounts.admin.key(),
            whitelist_auth,
            fee_bps,
            compliance_enabled,
        });

        Ok(())
    }
}
