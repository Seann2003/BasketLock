use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{self, Mint, MintTo, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{constants::*, error::BasketError, events::*, state::*};

#[event_cpi]
#[derive(Accounts)]
pub struct DepositMulti<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Box<Account<'info, Config>>,

    pub basket: AccountLoader<'info, Basket>,

    /// Mint authority PDA — signs the QSHARE mint_to CPI.
    /// CHECK: Validated via `validate_mint_authority`.
    pub mint_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub share_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = share_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_share_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Optional compliance allow-list entry.
    /// Must be provided when `config.compliance_enabled` is true.
    pub user_allow_list: Option<Box<Account<'info, UserAllowList>>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// Validated token-leg accounts extracted from remaining_accounts.
struct TokenLeg<'info> {
    basket_token: Account<'info, BasketToken>,
    mint_info: &'info AccountInfo<'info>,
    user_ata_info: &'info AccountInfo<'info>,
    vault_ata_info: &'info AccountInfo<'info>,
    fee_vault_info: &'info AccountInfo<'info>,
}

impl<'info> DepositMulti<'info> {
    pub fn handler(
        ctx: Context<'_, '_, 'info, 'info, DepositMulti<'info>>,
        amounts: Vec<u64>,
    ) -> Result<()> {
        let accounts = &ctx.accounts;
        let remaining = ctx.remaining_accounts;
        let num_tokens = amounts.len();

        let basket = accounts.basket.load()?;

        // Fix #7: Enforce that deposit covers ALL basket tokens
        Self::validate_remaining_layout(remaining.len(), num_tokens, basket.token_count)?;
        Self::validate_share_mint(accounts, &basket)?;

        let basket_id_bytes = basket.basket_id.to_le_bytes();
        let mint_auth_seeds: &[&[u8]] = &[
            MINT_AUTHORITY_SEED,
            basket_id_bytes.as_ref(),
            &[basket.mint_authority_bump],
        ];
        Self::validate_mint_authority(accounts, mint_auth_seeds, ctx.program_id)?;
        Self::check_compliance(accounts)?;

        let fee_bps = basket.effective_fee_bps(accounts.config.fee_bps);
        drop(basket);
        // Fix #2: Pre-read all vault balances BEFORE any transfers
        let total_supply = accounts.share_mint.supply;
        let mut pre_vault_balances: Vec<u64> = Vec::with_capacity(num_tokens);
        for i in 0..num_tokens {
            let base = i * DEPOSIT_ACCOUNTS_PER_TOKEN;
            let vault_ata_info = &remaining[base + 3];
            let balance = Self::read_vault_balance(vault_ata_info)?;
            pre_vault_balances.push(balance);
        }

        // Compute total vault value (sum of all vault balances, normalised)
        let mut total_vault_value: u128 = 0;
        for i in 0..num_tokens {
            let base = i * DEPOSIT_ACCOUNTS_PER_TOKEN;
            let basket_token: Account<BasketToken> = Account::try_from(&remaining[base])?;
            total_vault_value = total_vault_value
                .checked_add(Self::normalise_amount(pre_vault_balances[i], basket_token.decimals)?)
                .ok_or(BasketError::ArithmeticOverflow)?;
        }

        let mut total_shares: u64 = 0;

        for i in 0..num_tokens {
            let leg = Self::parse_and_validate_leg(
                remaining,
                i,
                accounts.basket.key(),
            )?;

            let amount = amounts[i];
            require!(amount > 0, BasketError::ZeroDeposit);

            let (net_amount, fee_amount) = Self::compute_fee(amount, fee_bps)?;

            Self::transfer_to_vault(accounts, &leg, net_amount)?;

            if fee_amount > 0 {
                Self::transfer_to_fee_vault(accounts, &leg, fee_amount)?;
            }

            // Fix #2: Vault-weighted share pricing
            let normalised_deposit = Self::normalise_amount(net_amount, leg.basket_token.decimals)?;

            let shares_for_leg = if total_supply == 0 {
                // First depositor: shares = normalised deposit value
                normalised_deposit as u64
            } else {
                // Subsequent: shares = (deposit_value / total_vault_value) * total_supply
                normalised_deposit
                    .checked_mul(total_supply as u128)
                    .ok_or(BasketError::ArithmeticOverflow)?
                    .checked_div(total_vault_value)
                    .ok_or(BasketError::ArithmeticOverflow)? as u64
            };

            total_shares = total_shares
                .checked_add(shares_for_leg)
                .ok_or(BasketError::ArithmeticOverflow)?;
        }

        // Fix #6: Reject deposits that produce zero shares
        require!(total_shares > 0, BasketError::ZeroSharesMinted);

        Self::mint_shares(accounts, mint_auth_seeds, total_shares)?;

        emit_cpi!(DepositCompleted {
            basket: accounts.basket.key(),
            user: accounts.user.key(),
            shares_minted: total_shares,
        });

        Ok(())
    }

    // -- Validation helpers ---------------------------------------------------

    /// Fix #7: Enforce that deposit covers ALL basket tokens
    fn validate_remaining_layout(
        remaining_len: usize,
        num_tokens: usize,
        token_count: u8,
    ) -> Result<()> {
        require!(
            num_tokens == token_count as usize,
            BasketError::IncompleteWithdrawal
        );
        require!(
            remaining_len
                == num_tokens
                    .checked_mul(DEPOSIT_ACCOUNTS_PER_TOKEN)
                    .ok_or(BasketError::ArithmeticOverflow)?,
            BasketError::InvalidRemainingAccounts
        );
        Ok(())
    }

    fn validate_share_mint(
        accounts: &DepositMulti<'info>,
        basket: &Basket,
    ) -> Result<()> {
        require!(
            accounts.share_mint.key() == basket.share_mint,
            BasketError::ShareMintMismatch
        );
        Ok(())
    }

    fn validate_mint_authority(
        accounts: &DepositMulti<'info>,
        seeds: &[&[u8]],
        program_id: &Pubkey,
    ) -> Result<()> {
        let expected = Pubkey::create_program_address(seeds, program_id)
            .map_err(|_| BasketError::InvalidBasketWiring)?;
        require!(
            accounts.mint_authority.key() == expected,
            BasketError::InvalidBasketWiring
        );
        Ok(())
    }

    fn check_compliance(accounts: &DepositMulti<'info>) -> Result<()> {
        if !accounts.config.compliance_enabled {
            return Ok(());
        }
        let allow_list = accounts
            .user_allow_list
            .as_ref()
            .ok_or(BasketError::ComplianceDenied)?;
        require!(allow_list.allowed, BasketError::ComplianceDenied);
        require!(
            allow_list.basket == accounts.basket.key(),
            BasketError::ComplianceDenied
        );
        require!(
            allow_list.user == accounts.user.key(),
            BasketError::ComplianceDenied
        );
        Ok(())
    }

    // -- Per-leg parsing ------------------------------------------------------

    fn parse_and_validate_leg(
        remaining: &'info [AccountInfo<'info>],
        index: usize,
        basket_key: Pubkey,
    ) -> Result<TokenLeg<'info>> {
        let base = index * DEPOSIT_ACCOUNTS_PER_TOKEN;
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

        let vault_ata_info = &remaining[base + 3];
        let fee_vault_info = &remaining[base + 4];
        require!(
            vault_ata_info.key() == basket_token.vault_ata,
            BasketError::InvalidBasketWiring
        );
        require!(
            fee_vault_info.key() == basket_token.fee_vault_ata,
            BasketError::InvalidBasketWiring
        );

        Ok(TokenLeg {
            basket_token,
            mint_info,
            user_ata_info: &remaining[base + 2],
            vault_ata_info,
            fee_vault_info,
        })
    }

    fn compute_fee(amount: u64, fee_bps: u16) -> Result<(u64, u64)> {
        let fee = (amount as u128)
            .checked_mul(fee_bps as u128)
            .ok_or(BasketError::ArithmeticOverflow)?
            .checked_div(BPS_DENOMINATOR as u128)
            .ok_or(BasketError::ArithmeticOverflow)? as u64;
        let net = amount
            .checked_sub(fee)
            .ok_or(BasketError::ArithmeticOverflow)?;
        Ok((net, fee))
    }

    /// Normalise a token amount to QSHARE decimal precision (u128 intermediate).
    fn normalise_amount(amount: u64, token_decimals: u8) -> Result<u128> {
        let amount_128 = amount as u128;
        if token_decimals >= QSHARE_DECIMALS {
            let divisor = 10u128
                .checked_pow((token_decimals - QSHARE_DECIMALS) as u32)
                .ok_or(BasketError::ArithmeticOverflow)?;
            amount_128
                .checked_div(divisor)
                .ok_or(BasketError::ArithmeticOverflow.into())
        } else {
            let multiplier = 10u128
                .checked_pow((QSHARE_DECIMALS - token_decimals) as u32)
                .ok_or(BasketError::ArithmeticOverflow)?;
            amount_128
                .checked_mul(multiplier)
                .ok_or(BasketError::ArithmeticOverflow.into())
        }
    }

    /// Read vault balance using proper TokenAccount deserialization.
    fn read_vault_balance<'a>(vault_ata_info: &'a AccountInfo<'a>) -> Result<u64> {
        let vault_ata: InterfaceAccount<TokenAccount> =
            InterfaceAccount::try_from(vault_ata_info)
                .map_err(|_| BasketError::InvalidBasketWiring)?;
        Ok(vault_ata.amount)
    }

    fn transfer_to_vault(
        accounts: &DepositMulti<'info>,
        leg: &TokenLeg<'info>,
        amount: u64,
    ) -> Result<()> {
        token_interface::transfer_checked(
            CpiContext::new(
                accounts.token_program.to_account_info(),
                TransferChecked {
                    from: leg.user_ata_info.to_account_info(),
                    to: leg.vault_ata_info.to_account_info(),
                    authority: accounts.user.to_account_info(),
                    mint: leg.mint_info.to_account_info(),
                },
            ),
            amount,
            leg.basket_token.decimals,
        )
    }

    fn transfer_to_fee_vault(
        accounts: &DepositMulti<'info>,
        leg: &TokenLeg<'info>,
        amount: u64,
    ) -> Result<()> {
        token_interface::transfer_checked(
            CpiContext::new(
                accounts.token_program.to_account_info(),
                TransferChecked {
                    from: leg.user_ata_info.to_account_info(),
                    to: leg.fee_vault_info.to_account_info(),
                    authority: accounts.user.to_account_info(),
                    mint: leg.mint_info.to_account_info(),
                },
            ),
            amount,
            leg.basket_token.decimals,
        )
    }

    fn mint_shares(
        accounts: &DepositMulti<'info>,
        mint_auth_seeds: &[&[u8]],
        total_shares: u64,
    ) -> Result<()> {
        token_interface::mint_to(
            CpiContext::new_with_signer(
                accounts.token_program.to_account_info(),
                MintTo {
                    mint: accounts.share_mint.to_account_info(),
                    to: accounts.user_share_ata.to_account_info(),
                    authority: accounts.mint_authority.to_account_info(),
                },
                &[mint_auth_seeds],
            ),
            total_shares,
        )
    }
}
