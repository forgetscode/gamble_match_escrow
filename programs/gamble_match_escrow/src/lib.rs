use anchor_lang::prelude::*;
use anchor_lang::prelude::borsh::BorshDeserialize;
use anchor_spl::token::{self, SetAuthority, TokenAccount, Transfer, Mint};
use spl_token::instruction::AuthorityType;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod gamble_match_escrow {
    use super::*;
    
    pub fn initialize_escrow(ctx: Context<InitializeEscrow>, initializer_amount: u64) -> ProgramResult {
        &mut ctx.accounts.escrow_account.load();

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
    // not really sure what i'm doing here but it's 5am and i'm tired yolo
    pub fn add_user(ctx: Context<AddUser>, amount: u64) -> ProgramResult {
        // let (vault_authority, _vault_authority_bump) =
        //     Pubkey::find_program_address(&[b"authority-seed"], ctx.program_id);
        // token::set_authority(
        //     ctx.accounts.into_set_authority_context(),
        //     AuthorityType::AccountOwner,
        //     Some(vault_authority),
        // )?;
        token::transfer(
            ctx.accounts.into_transfer_to_pda_context(),
            amount,
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(signer)]
    pub user_as_authority: AccountInfo<'info>,  // used to be initializer
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub initializer_deposit_token_account: Account<'info, TokenAccount>,

    #[account(init, payer = user_as_authority, space = 512)]
    pub escrow_account: Account<'info, MatchAccount>,

    #[account(
        init,
        payer = user_as_authority,
        token::mint = mint,
        token::authority = user_as_authority,
    )]
    pub vault_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct AddUser<'info> {

    #[account(signer)]
    pub user_as_authority: AccountInfo<'info>, // used to be initializer
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub deposit_token_account: Account<'info, TokenAccount>,

    #[account(
    mut,
    has_one = user_as_authority
    )]
    pub escrow_account: Account<'info, MatchAccount>,

    #[account(mut)]
    pub vault_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: AccountInfo<'info>,
}

#[account]
pub struct MatchAccount {
    pub user_as_authority: Pubkey,
    pub game_state: bool,
    pub user_balances: [u8; 8],
    pub user_keys: [Pubkey; 8]
}

impl MatchAccount {
    fn empty_key() -> Pubkey {
        Pubkey::new_from_array([0u8; 32])
    }
    pub fn load(&mut self) {
        let rnd_key = MatchAccount::empty_key();
        self.game_state = false;
        self.user_balances = [0_u8; 8];
        self.user_keys = [rnd_key; 8];
    }
    fn look_for_empty_idx(&mut self) -> Option<usize> {
        let empty_key = &MatchAccount::empty_key();
        let mut i = 0;
        let mut result: Option<usize> = None;
        for key in &self.user_keys {
            if key == empty_key {
                result = Some(i);
                break;
            }
            i += 1;
        }
        result
    }
    pub fn add_user_to_match(&mut self, user_key: Pubkey, user_bal: u8) {
        let empty_idx = self.look_for_empty_idx();
        if let Some(empty_idx) = empty_idx {
            self.user_keys[empty_idx] = user_key;
            self.user_balances[empty_idx] = user_bal;
        }
    }
}

impl<'info> InitializeEscrow<'info> {
    fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self
                .initializer_deposit_token_account
                .to_account_info()
                .clone(),
            to: self.vault_account.to_account_info().clone(),
            authority: self.user_as_authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_set_authority_context(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self.vault_account.to_account_info().clone(),
            current_authority: self.user_as_authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

impl<'info> AddUser<'info> {
    fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self
                .deposit_token_account
                .to_account_info()
                .clone(),
            to: self.vault_account.to_account_info().clone(),
            authority: self.user_as_authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
    fn into_set_authority_context(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self.vault_account.to_account_info().clone(),
            current_authority: self.user_as_authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}
