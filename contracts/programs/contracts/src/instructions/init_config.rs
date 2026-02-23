use anchor_lang::prelude::*;

use crate::{constants::*, error::BasketError, events::*, state::Config};

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
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitConfig<'info> {
    pub fn handler(
        &mut self,
        fee_bps: u16,
        whitelist_auth: Pubkey,
        compliance_enabled: bool,
        bumps: &InitConfigBumps,
    ) -> Result<()> {
        require!(
            (FEE_BPS_MIN..=FEE_BPS_MAX).contains(&fee_bps),
            BasketError::InvalidFee
        );

        self.config.set_inner(Config {
            admin: self.admin.key(),
            whitelist_auth,
            fee_bps,
            compliance_enabled,
            version: CURRENT_VERSION,
            bump: bumps.config,
        });

        emit!(ConfigInitialized {
            admin: self.admin.key(),
            whitelist_auth,
            fee_bps,
            compliance_enabled,
        });

        Ok(())
    }
}
