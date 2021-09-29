use anchor_lang::prelude::*;
use anchor_spl::token::{self, SetAuthority, TokenAccount, Transfer};
use spl_token::instruction::AuthorityType;
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod gamble_match_escrow {
    use super::*;
    pub fn initialize(
        ctx: Context<Initialize>,
        // min_fee: u64,
    ) -> ProgramResult {
        ctx.accounts.match_account.initializer_key = *ctx.accounts.initializer.key;
        ctx.accounts
            .match_account
            .initializer_deposit_token_account = *ctx
            .accounts
            .match_account
            .to_account_info()
            .key;
        ctx.accounts
            .match_account
            .initializer_receive_token_account = *ctx
            .accounts
            .match_account
            .to_account_info()
            .key;
        // let (pda, _bump_seed) = Pubkey::find_program_address(&[b"escrow"], ctx.program_id);
        // token::set_authority(ctx.accounts.into(), AuthorityType::AccountOwner, Some(pda))?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(signer)]
    pub initializer: AccountInfo<'info>,
    #[account(mut)]
    pub match_account: Account<'info, MatchAccount>,
    // pub match_account: Account<'info, EscrowAccount>,
    // pub token: AccountInfo<'info>,
}

pub type MatchDataArray<'info> = &'info [u16];
#[account]
pub struct MatchAccount {
    pub
    pub initializer_deposit_token_account: Pubkey,
    pub initializer_receive_token_account: Pubkey,
}

// impl<'info> From<&mut Initialize<'info>>
//     for CpiContext<'_, '_, '_, 'info, SetAuthority<'info>>
// {
//     fn from(accounts: &mut Initialize<'info>) -> Self {
//         let cpi_accounts = SetAuthority {
//             account_or_mint: accounts
//                 .initializer_fees_account
//                 .to_account_info()
//                 .clone(),
//             current_authority: accounts.initializer.clone(),
//         };
//         let cpi_program = accounts.token_program.clone();
//         CpiContext::new(cpi_program, cpi_accounts)
//     }
// }
