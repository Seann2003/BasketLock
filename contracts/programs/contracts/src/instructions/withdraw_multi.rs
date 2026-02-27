use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Burn, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{constants::*, error::BasketError, events::*, state::*};

#[event_cpi]
#[derive(Accounts)]
pub struct WithdrawMulti<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Box<Account<'info, Config>>,

    pub basket: AccountLoader<'info, Basket>,

    #[account(mut)]
    pub share_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = share_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_share_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Vault authority PDA — signs transfers out.
    /// CHECK: Validated via `validate_vault_authority`.
    pub vault_authority: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

/// Validated token-leg accounts extracted from remaining_accounts.
struct WithdrawLeg<'info> {
    basket_token: Account<'info, BasketToken>,
    mint_info: &'info AccountInfo<'info>,
    vault_ata_info: &'info AccountInfo<'info>,
    user_ata_info: &'info AccountInfo<'info>,
}

impl<'info> WithdrawMulti<'info> {
    pub fn handler(
        ctx: Context<'_, '_, 'info, 'info, WithdrawMulti<'info>>,
        shares_to_burn: u64,
    ) -> Result<()> {
        let accounts = &ctx.accounts;
        let remaining = ctx.remaining_accounts;

        let basket = accounts.basket.load()?;
        let num_tokens = Self::validate_remaining_layout(remaining.len(), basket.token_count)?;
        Self::validate_burn_input(accounts, shares_to_burn)?;
        Self::validate_share_mint(accounts, &basket)?;

        let basket_id_bytes = basket.basket_id.to_le_bytes();
        let vault_auth_seeds: &[&[u8]] = &[
            VAULT_AUTHORITY_SEED,
            basket_id_bytes.as_ref(),
            &[basket.vault_authority_bump],
        ];
        Self::validate_vault_authority(accounts, vault_auth_seeds, ctx.program_id)?;
        drop(basket);

        let total_supply = accounts.share_mint.supply;

        Self::burn_shares(accounts, shares_to_burn)?;

        for i in 0..num_tokens {
            let leg = Self::parse_and_validate_leg(
                remaining,
                i,
                accounts.basket.key(),
            )?;

            let amount_out = Self::compute_proportional_payout(
                &leg,
                shares_to_burn,
                total_supply,
            )?;

            if amount_out == 0 {
                continue;
            }

            Self::transfer_from_vault(accounts, &leg, vault_auth_seeds, amount_out)?;
        }

        emit_cpi!(WithdrawCompleted {
            basket: accounts.basket.key(),
            user: accounts.user.key(),
            shares_burned: shares_to_burn,
        });

        Ok(())
    }

    /// Enforce remaining accounts cover all basket tokens.
    fn validate_remaining_layout(remaining_len: usize, token_count: u8) -> Result<usize> {
        let expected = (token_count as usize)
            .checked_mul(WITHDRAW_ACCOUNTS_PER_TOKEN)
            .ok_or(BasketError::ArithmeticOverflow)?;
        require!(
            remaining_len == expected,
            BasketError::IncompleteWithdrawal
        );
        Ok(token_count as usize)
    }

    fn validate_burn_input(
        accounts: &WithdrawMulti<'info>,
        shares_to_burn: u64,
    ) -> Result<()> {
        require!(shares_to_burn > 0, BasketError::InsufficientShares);
        require!(
            accounts.user_share_ata.amount >= shares_to_burn,
            BasketError::InsufficientShares
        );
        Ok(())
    }

    fn validate_share_mint(
        accounts: &WithdrawMulti<'info>,
        basket: &Basket,
    ) -> Result<()> {
        require!(
            accounts.share_mint.key() == basket.share_mint,
            BasketError::ShareMintMismatch
        );
        Ok(())
    }

    fn validate_vault_authority(
        accounts: &WithdrawMulti<'info>,
        seeds: &[&[u8]],
        program_id: &Pubkey,
    ) -> Result<()> {
        let expected = Pubkey::create_program_address(seeds, program_id)
            .map_err(|_| BasketError::InvalidBasketWiring)?;
        require!(
            accounts.vault_authority.key() == expected,
            BasketError::VaultAuthMismatch
        );
        Ok(())
    }

    fn parse_and_validate_leg(
        remaining: &'info [AccountInfo<'info>],
        index: usize,
        basket_key: Pubkey,
    ) -> Result<WithdrawLeg<'info>> {
        let base = index * WITHDRAW_ACCOUNTS_PER_TOKEN;
        let basket_token: Account<BasketToken> = Account::try_from(&remaining[base])?;

        require!(
            basket_token.basket == basket_key,
            BasketError::InvalidBasketWiring
        );
        require!(basket_token.enabled, BasketError::TokenNotEnabled);

        let mint_info = &remaining[base + 1];
        require!(
            mint_info.key() == basket_token.mint,
            BasketError::MintConfigMismatch
        );

        let vault_ata_info = &remaining[base + 2];
        require!(
            vault_ata_info.key() == basket_token.vault_ata,
            BasketError::InvalidBasketWiring
        );

        Ok(WithdrawLeg {
            basket_token,
            mint_info,
            vault_ata_info,
            user_ata_info: &remaining[base + 3],
        })
    }

    /// `amount_out = vault_balance * shares_to_burn / total_supply`
    fn compute_proportional_payout(
        leg: &WithdrawLeg<'info>,
        shares_to_burn: u64,
        total_supply: u64,
    ) -> Result<u64> {
        let vault_balance = Self::read_vault_balance(leg.vault_ata_info)?;

        let amount_out = (vault_balance as u128)
            .checked_mul(shares_to_burn as u128)
            .ok_or(BasketError::ArithmeticOverflow)?
            .checked_div(total_supply as u128)
            .ok_or(BasketError::ArithmeticOverflow)? as u64;

        Ok(amount_out)
    }

    fn read_vault_balance<'a>(vault_ata_info: &'a AccountInfo<'a>) -> Result<u64> {
        let vault_ata: InterfaceAccount<TokenAccount> =
            InterfaceAccount::try_from(vault_ata_info)
                .map_err(|_| BasketError::InvalidBasketWiring)?;
        Ok(vault_ata.amount)
    }

    fn burn_shares(
        accounts: &WithdrawMulti<'info>,
        shares_to_burn: u64,
    ) -> Result<()> {
        token_interface::burn(
            CpiContext::new(
                accounts.token_program.to_account_info(),
                Burn {
                    mint: accounts.share_mint.to_account_info(),
                    from: accounts.user_share_ata.to_account_info(),
                    authority: accounts.user.to_account_info(),
                },
            ),
            shares_to_burn,
        )
    }

    fn transfer_from_vault(
        accounts: &WithdrawMulti<'info>,
        leg: &WithdrawLeg<'info>,
        vault_auth_seeds: &[&[u8]],
        amount: u64,
    ) -> Result<()> {
        token_interface::transfer_checked(
            CpiContext::new_with_signer(
                accounts.token_program.to_account_info(),
                TransferChecked {
                    from: leg.vault_ata_info.to_account_info(),
                    to: leg.user_ata_info.to_account_info(),
                    authority: accounts.vault_authority.to_account_info(),
                    mint: leg.mint_info.to_account_info(),
                },
                &[vault_auth_seeds],
            ),
            amount,
            leg.basket_token.decimals,
        )
    }
}
