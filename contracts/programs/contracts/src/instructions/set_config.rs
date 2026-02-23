use anchor_lang::prelude::*;

use crate::{constants::*, error::BasketError, state::Config};

#[derive(Accounts)]
pub struct SetConfig<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ BasketError::Unauthorized,
    )]
    pub config: Account<'info, Config>,
}

impl<'info> SetConfig<'info> {
    pub fn handler(
        &mut self,
        fee_bps: Option<u16>,
        whitelist_auth: Option<Pubkey>,
        compliance_enabled: Option<bool>,
        new_admin: Option<Pubkey>,
    ) -> Result<()> {
        if let Some(bps) = fee_bps {
            require!(
                (FEE_BPS_MIN..=FEE_BPS_MAX).contains(&bps),
                BasketError::InvalidFee
            );
            self.config.fee_bps = bps;
        }

        if let Some(auth) = whitelist_auth {
            self.config.whitelist_auth = auth;
        }

        if let Some(enabled) = compliance_enabled {
            self.config.compliance_enabled = enabled;
        }

        if let Some(admin) = new_admin {
            self.config.admin = admin;
        }

        Ok(())
    }
}
