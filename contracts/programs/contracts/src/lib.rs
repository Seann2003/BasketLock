pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use events::*;
pub use instructions::*;
pub use state::*;

declare_id!("2rQ6Auaeqovph67yWxhFpuhitrJJkGU3jrZwUUSYJKs6");

#[program]
pub mod contracts {
    use super::*;

    pub fn init_config(
        ctx: Context<InitConfig>,
        fee_bps: u16,
        whitelist_auth: Pubkey,
        compliance_enabled: bool,
    ) -> Result<()> {
        InitConfig::handler(ctx, fee_bps, whitelist_auth, compliance_enabled)
    }

    pub fn set_config(
        ctx: Context<SetConfig>,
        fee_bps: Option<u16>,
        whitelist_auth: Option<Pubkey>,
        compliance_enabled: Option<bool>,
        new_admin: Option<Pubkey>,
    ) -> Result<()> {
        SetConfig::handler(ctx, fee_bps, whitelist_auth, compliance_enabled, new_admin)
    }

    pub fn create_basket(
        ctx: Context<CreateBasket>,
        basket_id: u64,
        name: [u8; MAX_NAME_LEN],
        fee_bps_override: Option<u16>,
    ) -> Result<()> {
        CreateBasket::handler(ctx, basket_id, &name, fee_bps_override)
    }

    pub fn add_tokens(ctx: Context<AddTokens>) -> Result<()> {
        AddTokens::handler(ctx)
    }

    pub fn update_allow_list(ctx: Context<UpdateAllowList>, allowed: bool) -> Result<()> {
        UpdateAllowList::handler(ctx, allowed)
    }

    pub fn deposit_multi<'info>(
        ctx: Context<'_, '_, 'info, 'info, DepositMulti<'info>>,
        amounts: Vec<u64>,
    ) -> Result<()> {
        DepositMulti::handler(ctx, amounts)
    }

    pub fn withdraw_multi<'info>(
        ctx: Context<'_, '_, 'info, 'info, WithdrawMulti<'info>>,
        shares_to_burn: u64,
    ) -> Result<()> {
        WithdrawMulti::handler(ctx, shares_to_burn)
    }

    pub fn verify_basket_owner<'info>(
        ctx: Context<'_, '_, 'info, 'info, VerifyBasketOwner<'info>>,
        expected_owner: Pubkey,
    ) -> Result<()> {
        VerifyBasketOwner::handler(ctx, expected_owner)
    }
}
