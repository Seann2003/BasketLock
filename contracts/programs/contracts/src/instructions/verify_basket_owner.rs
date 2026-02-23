use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::{constants::*, error::BasketError, state::*};

#[derive(Accounts)]
pub struct VerifyBasketOwner<'info> {
    pub basket: AccountLoader<'info, Basket>,

    /// The QSHARE mint for this basket.
    pub share_mint: InterfaceAccount<'info, Mint>,

    /// Vault authority PDA.
    /// CHECK: Validated in handler against expected derivation.
    pub vault_authority: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> VerifyBasketOwner<'info> {
    pub fn handler(
        ctx: Context<'_, '_, 'info, 'info, VerifyBasketOwner<'info>>,
        expected_owner: Pubkey,
    ) -> Result<()> {
        let accounts = &ctx.accounts;
        let basket = accounts.basket.load()?;

        require!(
            basket.version == CURRENT_VERSION,
            BasketError::UnsupportedVersion
        );

        require!(
            basket.owner == expected_owner,
            BasketError::OwnerMismatch
        );

        require!(
            accounts.share_mint.key() == basket.share_mint,
            BasketError::ShareMintMismatch
        );

        let basket_id_bytes = basket.basket_id.to_le_bytes();
        let vault_auth_seeds: &[&[u8]] = &[
            VAULT_AUTHORITY_SEED,
            basket_id_bytes.as_ref(),
            &[basket.vault_authority_bump],
        ];
        let expected_vault_auth =
            Pubkey::create_program_address(vault_auth_seeds, ctx.program_id)
                .map_err(|_| BasketError::VaultAuthMismatch)?;
        require!(
            accounts.vault_authority.key() == expected_vault_auth,
            BasketError::VaultAuthMismatch
        );

        // 5. Optional per-mint BasketToken validation via remaining_accounts
        for account_info in ctx.remaining_accounts {
            let basket_token: Account<BasketToken> =
                Account::try_from(account_info)?;
            require!(
                basket_token.basket == accounts.basket.key(),
                BasketError::MintConfigMismatch
            );
            require!(basket_token.enabled, BasketError::TokenNotEnabled);
        }

        Ok(())
    }
}
