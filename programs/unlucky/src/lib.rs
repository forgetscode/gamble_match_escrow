use std::cell::Ref;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, SetAuthority, TokenAccount, Transfer, Mint, Token};
use spl_token::instruction::AuthorityType;
use spl_token::state::Multisig;

declare_id!("2NG4CobL3ZSBgCkfu3p9L3stuuoTMWTkmSMHrmdrZCcN");

#[program]
pub mod unlucky {
    use spl_token::instruction::AuthorityType;
    use super::*;
    const VAULT_AUTHORITY_SEED: &[u8] = b"test-seed";
    const RENT_AMOUNT: u64 = 4370880;
    // Initializes a new multisig account with a set of owners and a threshold.
    // pub fn create_multisig(
    //     ctx: Context<CreateMultisig>,
    //     owners: Vec<Pubkey>,
    //     threshold: u64,
    //     nonce: u8,
    // ) -> ProgramResult {
    //     let multisig = &mut ctx.accounts.multisig;
    //     let mut i = 0;
    //     let multisig_length = multisig.signers.len();
    //     for owner in &owners {
    //         if i >= multisig_length {
    //             break;
    //         }
    //         multisig.signers[i] = owner.clone();
    //         i += 1;
    //     }
    //     // multisig.owners = owners;
    //     // multisig.threshold = threshold;
    //     // multisig.nonce = nonce;
    //     Ok(())
    // }
    pub fn init_match(ctx: Context<Initialize>, bump: u8) -> ProgramResult {
        ctx.accounts.match_account.bump = bump;
        ctx.accounts.match_account.authority = *ctx.accounts.authority.key;
        ctx.accounts.match_account.is_started = false;
        Ok(())
    }
}

pub fn try_make_token_account(account_info: &AccountInfo) -> Result<TokenAccount, ProgramError> {
    let data: Ref<&mut [u8]> = account_info.try_borrow_data()?;
    let data = &mut &**data;
    let token_account = TokenAccount::try_deserialize(data)?;
    std::mem::size_of::<MatchAccount>();
    Ok(token_account)
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(mut, signer)]
    pub authority: AccountInfo<'info>,
    #[account(
        init,
        seeds=[authority.key().as_ref()],
        bump = bump,
        payer = initializer,
        space = std::mem::size_of::<MatchAccount>() + 8
    )]
    pub match_account: Account<'info, MatchAccount>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    // pub token_program: AccountInfo<'info>,
}

#[account]
pub struct MatchAccount {
    authority: Pubkey,
    bump: u8,
    is_started: bool
}

