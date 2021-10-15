use std::collections::BinaryHeap;

use anchor_lang::prelude::*;
use rust_base58::ToBase58;

declare_id!("EmjHSYUct3Z5Sk2LUaBcFDZBbw1NU6v5NSQQzmzr6W5S");

#[program]
pub mod unlucky {
    use super::*;

    pub fn init_match(ctx: Context<Initialize>, bump: u8) -> ProgramResult {
        ctx.accounts.match_account.bump = bump;
        ctx.accounts.match_account.authority = *ctx.accounts.match_authority.key;
        ctx.accounts.match_account.is_started = false;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub server_authority: Signer<'info>,
    #[account(mut, signer)]
    pub match_authority: AccountInfo<'info>,
    #[account(
    init,
    seeds = [match_authority.key().as_ref()],
    bump = bump,
    payer = server_authority,
    space = std::mem::size_of::< MatchAccount > () + 8
    )]
    pub match_account: Account<'info, MatchAccount>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MatchAccount {
    authority: Pubkey,
    bump: u8,
    is_started: bool,
}

