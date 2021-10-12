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
    pub fn start_match(ctx: Context<Initialize>, bump: u8) -> ProgramResult {
        ctx.accounts.match_account.bump = bump;
        ctx.accounts.match_account.authority = *ctx.accounts.authority.key;
        ctx.accounts.match_account.is_started = false;
        // msg!("match_account_id: {} | match_account_id_owner: {}", ctx.accounts.match_account_id.key, ctx.accounts.match_account_id.owner.key());
        // msg!("match_account: {} | match_account_owner: {}", ctx.accounts.match_account, ctx.accounts.match_account.owner.key());
        // let match_id: &[u8] = &ctx.accounts.match_account.key.to_bytes()[..];
        // let (vault_authority, _vault_authority_bump) = Pubkey::find_program_address(&[match_id], ctx.program_id);
        // token::set_authority(
        //     ctx.accounts.transfer_account_ownership(),
        //     AuthorityType::AccountOwner,
        //     Some(vault_authority.clone()),
        // )?;
        Ok(())
    }
    // pub fn set_token_acc_owners(ctx: Context<Auth>) -> ProgramResult {
    //     let cpi_account = ctx.accounts.transfer_account_ownership();
    //     if let Err(e) = cpi_account {
    //         return Err(e);
    //     }
    //     spl_token::instruction::set_authority()
    //     let cpi_account = cpi_account.unwrap();
    //     // let mut remaining_accounts: &[AccountInfo] = ctx.remaining_accounts;
    //     let (vault_authority, _vault_authority_bump) =
    //         Pubkey::find_program_address(&[VAULT_AUTHORITY_SEED], ctx.program_id);
    //     token::set_authority(
    //         cpi_account,
    //         AuthorityType::AccountOwner,
    //         Some(vault_authority.clone()),
    //     )?;
    //     Ok(())
    // }
}

pub fn try_make_token_account(account_info: &AccountInfo) -> Result<TokenAccount, ProgramError> {
    let data: Ref<&mut [u8]> = account_info.try_borrow_data()?;
    let data = &mut &**data;
    let token_account = TokenAccount::try_deserialize(data)?;
    std::mem::size_of::<MatchAccount>();
    Ok(token_account)
}

// #[derive(Accounts)]
// pub struct CreateMultisig<'info> {
//     #[account(zero)]
//     multisig: ProgramAccount<'info, Multisig>,
// }

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(mut, signer)]
    pub authority: AccountInfo<'info>,
    // #[account(
    //     init,
    //     payer = initializer,
    //     token::mint = mint,
    //     token::authority = vault_handler,
    // )]
    // pub vault_account: Account<'info, TokenAccount>,
    #[account(
        init,
        seeds=[authority.key().as_ref()],
        bump = bump,
        payer = initializer,
        space = std::mem::size_of::<MatchAccount>()
    )]
    pub match_account: Account<'info, MatchAccount>,
    // pub match_account_id: AccountInfo<'info>,
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
//
// impl MatchAccount {
//     pub fn load(&mut self) {
//         // self.match_id = match_id;
//         self.game_started = false;
//     }
// }
// #[derive(Accounts)]
// pub struct Auth<'info> {
//     #[account(mut)]
//     pub signer: Signer<'info>,
//     #[account(mut)]
//     pub user_temp_token_account: Account<'info, TokenAccount>,
//     pub token_program: AccountInfo<'info>,
//     #[account(zero)]
//     transaction: Account<'info, Transaction>,
// }

// pub struct ChangeAuthTransaction {
//     // The multisig account this transaction belongs to.
//     multisig: Pubkey,
//     // Target program to execute against.
//     program_id: Pubkey,
//     // Accounts required for the transaction.
//     accounts: Vec<TransactionAccount>,
//     // Instruction data for the transaction.
//     data: Vec<u8>,
//     // signers[index] is true iff multisig.owners[index] signed the transaction.
//     signers: Vec<bool>,
//     // Boolean ensuring one time execution.
//     did_execute: bool,
// }
impl<'info> Initialize<'info> {
    // pub fn transfer_account_ownership(&mut self, prog_id: Pubkey) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
    //     let cpi_accounts = SetAuthority {
    //         account_or_mint: self.match_account.to_account_info().clone(),
    //         current_authority: self.initializer.clone().to_account_info().clone(),
    //     };
    //     CpiContext::new(prog_id.to_account_info().clone(), cpi_accounts)
    // }
}
