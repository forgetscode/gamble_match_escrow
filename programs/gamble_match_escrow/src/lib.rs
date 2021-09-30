use anchor_lang::prelude::*;
use anchor_spl::token::{self, SetAuthority, TokenAccount, Transfer};
use spl_token::instruction::AuthorityType;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod gamble_match_escrow {
    use super::*;

    const ESCROW_PDA_SEED: &[u8] = b"escrow";

    pub fn initialize_escrow(ctx: Context<InitializeEscrow>) -> ProgramResult {
        let match_account = &mut ctx.accounts.escrow_account;
        match_account.user_data = [0,0,0,0,0];
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(init, payer = user, space = 48)]
    pub escrow_account: Account<'info, MatchAccount>,
    #[account(mut)]
    pub vault_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: AccountInfo<'info>,
}

/*
pub struct UserItem {
    pub account_key: Pubkey,
    pub balance: u16
}
*/

#[account]
pub struct MatchAccount {
    pub user_data:[u64; 5]
}