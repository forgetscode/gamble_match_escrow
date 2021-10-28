// use anchor_lang::prelude::*;
// use anchor_spl::token::{self, SetAuthority, TokenAccount, Transfer, Mint, CloseAccount};
// use spl_token::instruction::AuthorityType;
// use rust_base58::ToBase58;
//
// declare_id!("H6wh3ozZgxWgg1s9MjtRAoxsSuYBtgQafhkaoWEQGp7g");
//
// #[program]
// pub mod unlucky {
//     use super::*;
//     const VAULT_AUTHORITY_SEED: &[u8] = b"authority-seed";
//
//     pub fn add_user(ctx: Context<AddUserToMatch>, wager_amount: u64) -> ProgramResult {
//         let seed = &[&ctx.accounts.match_authority.key().to_bytes()[..], &ctx.accounts.user_account.key().to_bytes()[..]];
//         let (pda, _) = Pubkey::find_program_address(seed, ctx.program_id);
//
//         token::transfer(
//             ctx.accounts.into_transfer_to_pda_context(),
//             wager_amount,
//         )?;
//
//         token::set_authority(
//             ctx.accounts.into_set_authority_context(),
//             AuthorityType::AccountOwner,
//             Some(pda),
//         )?;
//         Ok(())
//     }
//
//     pub fn transfer_token(ctx: Context<TransferToken>, transfer_amount: u64, nonce: u8) -> ProgramResult {
//         let seeds = &[&ctx.accounts.match_authority.key().to_bytes()[..], &ctx.accounts.user_account.key().to_bytes()[..], &[nonce]];
//         let signer = &[&seeds[..]];
//
//         token::transfer(
//             ctx.accounts
//                 .into_transfer_context()
//                 .with_signer(signer),
//             transfer_amount
//         )?;
//         Ok(())
//     }
//
//     pub fn leave(ctx: Context<Leave>, nonce: u8) -> ProgramResult {
//         let seeds = &[&ctx.accounts.match_authority.key().to_bytes()[..], &ctx.accounts.user_account.key().to_bytes()[..], &[nonce]];
//         let signer = &[&seeds[..]];
//         token::transfer(
//             ctx.accounts
//                 .into_transfer_to_user_context()
//                 .with_signer(signer),
//             ctx.accounts.from_temp_token_account.amount
//         )?;
//         token::close_account(
//             ctx.accounts
//                 .into_close_account_context()
//                 .with_signer(signer)
//         )?;
//         Ok(())
//     }
// }
//
// #[derive(Accounts)]
// #[instruction(wager_amount: u64)]
// pub struct AddUserToMatch<'info> {
//     #[account(mut)]
//     pub initializer: Signer<'info>,
//     pub match_authority: AccountInfo<'info>,
//     pub mint: Account<'info, Mint>,
//     #[account(mut)]
//     pub user_account: Signer<'info>,
//     #[account(
//         mut,
//         constraint = from_user_token_account.amount >= wager_amount
//     )]
//     pub from_user_token_account: Account<'info, TokenAccount>,
//     #[account(
//         init,
//         payer = initializer,
//         token::mint = mint,
//         token::authority = initializer,
//     )]
//     pub to_temp_user_token_account: Account<'info, TokenAccount>,
//     pub system_program: Program<'info, System>,
//     pub rent: Sysvar<'info, Rent>,
//     pub token_program: AccountInfo<'info>,
// }
//
// #[derive(Accounts)]
// #[instruction(transfer_amount: u64)]
// pub struct TransferToken<'info> {
//     pub match_authority: AccountInfo<'info>,
//     #[account(
//         mut,
//         constraint = from_token_account.amount >= transfer_amount
//     )]
//     pub from_token_account: Account<'info, TokenAccount>,
//     #[account(mut)]
//     pub to_token_account: Account<'info, TokenAccount>,
//     #[account(mut)]
//     pub user_account: AccountInfo<'info>,
//     #[account(mut)]
//     pub program_signer: AccountInfo<'info>,
//     pub token_program: AccountInfo<'info>,
// }
//
// #[derive(Accounts)]
// pub struct Leave<'info> {
//     pub match_authority: AccountInfo<'info>,
//     #[account(mut)]
//     pub lamport_recipient: AccountInfo<'info>,
//     #[account(mut)]
//     pub from_temp_token_account: Account<'info, TokenAccount>,
//     #[account(mut)]
//     pub to_user_token_account:Account<'info, TokenAccount>,
//     #[account(mut)]
//     pub user_account: AccountInfo<'info>,
//     pub token_program: AccountInfo<'info>,
//     pub program_signer: AccountInfo<'info>,
// }
//
// impl<'info> AddUserToMatch<'info> {
//     fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
//         let cpi_accounts = Transfer {
//             from: self
//                 .from_user_token_account
//                 .to_account_info()
//                 .clone(),
//             to: self.to_temp_user_token_account.to_account_info().clone(),
//             authority: self.user_account.to_account_info().clone(),
//         };
//         CpiContext::new(self.token_program.clone(), cpi_accounts)
//     }
//
//     fn into_set_authority_context(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
//         let cpi_accounts = SetAuthority {
//             account_or_mint: self.to_temp_user_token_account.to_account_info().clone(),
//             current_authority: self.initializer.to_account_info().clone(),
//         };
//         CpiContext::new(self.token_program.clone(), cpi_accounts)
//     }
// }
//
// impl<'info> TransferToken<'info> {
//     fn into_transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
//         let cpi_accounts = Transfer {
//             from: self
//                 .from_token_account
//                 .to_account_info()
//                 .clone(),
//             to: self.to_token_account.to_account_info().clone(),
//             authority: self.program_signer.to_account_info().clone(),
//         };
//         CpiContext::new(self.token_program.clone(), cpi_accounts)
//     }
// }
// impl<'info> Leave<'info> {
//     fn into_transfer_to_user_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
//         let cpi_accounts = Transfer {
//             from: self
//                 .from_temp_token_account
//                 .to_account_info()
//                 .clone(),
//             to: self.to_user_token_account.to_account_info().clone(),
//             authority: self.program_signer.to_account_info().clone(),
//         };
//         CpiContext::new(self.token_program.clone(), cpi_accounts)
//     }
//     fn into_close_account_context(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
//         let cpi_accounts = CloseAccount {
//             account: self.from_temp_token_account.to_account_info().clone(),
//             destination: self.lamport_recipient.clone(),
//             authority: self.program_signer.clone(),
//         };
//         CpiContext::new(self.token_program.clone(), cpi_accounts)
//     }
// }
