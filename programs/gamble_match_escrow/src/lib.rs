use anchor_lang::prelude::*;
use anchor_spl::token::{self, SetAuthority, TokenAccount, Transfer, Mint};
use spl_token::instruction::AuthorityType;


declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod gamble_match_escrow {
    use super::*;

    /*
    const ESCROW_PDA_SEED: &[u8] = b"escrow";
    const _vault_account_bump: u8 = 4;
    const initializer_amount: u8 = 4;
    */
    
    pub fn initialize_escrow(ctx: Context<InitializeEscrow>, initializer_amount: u64) -> ProgramResult {
        let match_account = &mut ctx.accounts.escrow_account;
        match_account.game_state = false;
        match_account.user_data = [(Pubkey::new_unique(), 0);8];
        
        let (vault_authority, _vault_authority_bump) =
            Pubkey::find_program_address(&[b"authority-seed"], ctx.program_id);
        
        token::set_authority(
            ctx.accounts.into_set_authority_context(),
            AuthorityType::AccountOwner,
            Some(vault_authority),
        )?;

        token::transfer(
            ctx.accounts.into_transfer_to_pda_context(),
            initializer_amount,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(mut, signer)]
    pub initializer: AccountInfo<'info>,

    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub initializer_deposit_token_account:Account<'info, TokenAccount>,

    #[account(init, payer = initializer, space = 1 + 00)]
    pub escrow_account: Account<'info, MatchAccount>,

    #[account(
        init,
        payer = initializer,
        token::mint = mint,
        token::authority = initializer,
    )]
    pub vault_account: Account<'info, TokenAccount>,
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
    pub game_state: bool,
    pub user_data:[(Pubkey, u8);8]
}



impl<'info> InitializeEscrow<'info> {
    fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self
                .initializer_deposit_token_account
                .to_account_info()
                .clone(),
            to: self.vault_account.to_account_info().clone(),
            authority: self.initializer.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_set_authority_context(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self.vault_account.to_account_info().clone(),
            current_authority: self.initializer.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}
