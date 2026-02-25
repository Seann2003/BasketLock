use anchor_lang::prelude::*;

use crate::{constants::*, error::BasketError, events::*, state::Config};

#[event_cpi]
#[derive(Accounts)]
pub struct SetConfig<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ BasketError::Unauthorized,
    )]
    pub config: Box<Account<'info, Config>>,
}

impl<'info> SetConfig<'info> {
    pub fn handler(
        ctx: Context<SetConfig>,
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
            ctx.accounts.config.fee_bps = bps;
        }

        if let Some(auth) = whitelist_auth {
            ctx.accounts.config.whitelist_auth = auth;
        }

        if let Some(enabled) = compliance_enabled {
            ctx.accounts.config.compliance_enabled = enabled;
        }

        if let Some(admin) = new_admin {
            ctx.accounts.config.admin = admin;
        }

        emit_cpi!(ConfigUpdated {
            fee_bps: ctx.accounts.config.fee_bps,
            whitelist_auth: ctx.accounts.config.whitelist_auth,
            compliance_enabled: ctx.accounts.config.compliance_enabled,
            new_admin: ctx.accounts.config.admin,
        });

        Ok(())
    }
}
