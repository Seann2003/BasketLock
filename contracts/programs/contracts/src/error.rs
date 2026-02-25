use anchor_lang::prelude::*;

#[error_code]
#[derive(PartialEq)]
pub enum BasketError {
    #[msg("Unauthorized: caller is not the required authority")]
    Unauthorized,

    #[msg("Fee basis points out of allowed range")]
    InvalidFee,

    #[msg("Basket name exceeds maximum length")]
    NameTooLong,

    #[msg("Basket has reached maximum token capacity")]
    MaxTokensExceeded,

    #[msg("Mint is not whitelisted for this basket")]
    MintNotWhitelisted,

    #[msg("Token is not enabled in this basket")]
    TokenNotEnabled,

    #[msg("User is not on the compliance allow list")]
    ComplianceDenied,

    #[msg("Cannot deposit zero tokens")]
    ZeroDeposit,

    #[msg("Insufficient QSHARE balance for withdrawal")]
    InsufficientShares,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Remaining accounts length does not match expected layout")]
    InvalidRemainingAccounts,

    #[msg("Basket wiring is invalid: accounts do not match expected derivations")]
    InvalidBasketWiring,

    #[msg("Share mint does not match the basket's share mint")]
    ShareMintMismatch,

    #[msg("Vault authority does not match expected derivation")]
    VaultAuthMismatch,

    #[msg("Basket owner does not match expected owner")]
    OwnerMismatch,

    #[msg("Unsupported protocol version")]
    UnsupportedVersion,

    #[msg("Mint config does not match the expected BasketToken")]
    MintConfigMismatch,

    #[msg("Must withdraw all basket tokens (no partial withdrawal)")]
    IncompleteWithdrawal,

    #[msg("Deposit produced zero shares")]
    ZeroSharesMinted,

    #[msg("User ATA mint does not match the expected token mint")]
    UserAtaMintMismatch,

    #[msg("User ATA is not owned by a valid token program")]
    InvalidTokenProgramOwner,
}
