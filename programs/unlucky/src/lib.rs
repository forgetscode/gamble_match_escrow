use std::cell::Ref;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, SetAuthority, TokenAccount, Transfer, Mint, Token};
use spl_token::instruction::AuthorityType;
use spl_token::state::Multisig;

declare_id!("2NG4CobL3ZSBgCkfu3p9L3stuuoTMWTkmSMHrmdrZCcN");

#[program]
pub mod unlucky {
    use super::*;
    const VAULT_AUTHORITY_SEED: &[u8] = b"test-seed";
    const RENT_AMOUNT: u64 = 4370880;
    pub fn init_match(ctx: Context<Initialize>, bump: u8) -> ProgramResult {
        ctx.accounts.match_account.bump = bump;
        ctx.accounts.match_account.authority = *ctx.accounts.authority.key;
        ctx.accounts.match_account.is_started = false;
        Ok(())
    }
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
    pub system_program: Program<'info, System>
}

#[account]
pub struct MatchAccount {
    authority: Pubkey,
    bump: u8,
    is_started: bool
}

