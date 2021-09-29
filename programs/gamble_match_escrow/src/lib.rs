use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod gamble_match_escrow {
    use super::*;
    pub fn initialize_escrow(ctx: Context<InitializeEscrow>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(init, payer = user, space = 64)]
    pub escrow_account: Account<'info, MatchAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
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