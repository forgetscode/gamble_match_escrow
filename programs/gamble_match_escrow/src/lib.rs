use anchor_lang::prelude::*;
use anchor_lang::prelude::borsh::BorshDeserialize;
use anchor_spl::token::{self, SetAuthority, TokenAccount, Transfer, Mint};
use spl_token::instruction::AuthorityType;

declare_id!("AVjAc7YszkPzzyNCJ9rNM1Vh9Ve2HpWJUbi6mztCZi6D");

#[program]
pub mod gamble_match_escrow {
    use super::*;

    const VAULT_AUTHORITY_SEED: &[u8] = b"authority-seed";

    pub fn initialize_escrow(ctx: Context<InitializeEscrow>, initializer_amount: u64) -> ProgramResult {
        ctx.accounts.match_account.load();

        let (vault_authority, _vault_authority_bump) =
            Pubkey::find_program_address(&[VAULT_AUTHORITY_SEED], ctx.program_id);

        token::set_authority(
            ctx.accounts.into_set_authority_context(),
            AuthorityType::AccountOwner,
            Some(vault_authority),
        )?;

        token::transfer(
            ctx.accounts
                .into_transfer_to_pda_context(),
            initializer_amount,
        )?;
        ctx.accounts.match_account.add_user_to_match(ctx.accounts.user_account.key(), initializer_amount);
        Ok(())
    }
    pub fn add_user(ctx: Context<AddUser>, amount: u64) -> ProgramResult {
        let (_pda, _) = Pubkey::find_program_address(&[VAULT_AUTHORITY_SEED], ctx.program_id);
        let (vault_authority, _vault_authority_bump) =
            Pubkey::find_program_address(&[b"authority-seed"], ctx.program_id);
        ctx.accounts.match_account.add_user_to_match(ctx.accounts.user_account.key(), amount);
        token::set_authority(
            ctx.accounts.into_set_authority_context(),
            AuthorityType::AccountOwner,
            Some(vault_authority),
        )?;
        token::transfer(
            ctx.accounts
                .into_transfer_to_pda_context(),
            amount,
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(signer)]
    pub user_account: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub initializer_deposit_token_account: Account<'info, TokenAccount>,

    #[account(init, payer = user_account, space = 512)]
    pub match_account: Account<'info, MatchAccount>,

    #[account(
        init,
        payer = user_account,
        token::mint = mint,
        token::authority = user_account,
    )]
    pub vault_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct AddUser<'info> {

    #[account(signer)]
    pub user_account: AccountInfo<'info>, // used to be initializer
    // pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub deposit_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub match_account: Account<'info, MatchAccount>,

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
    pub user_balances: [u64; 8],
    pub user_keys: [Pubkey; 8]
}

impl MatchAccount {
    fn empty_key() -> Pubkey {
        Pubkey::new_from_array([0u8; 32])
    }
    pub fn load(&mut self) {
        let rnd_key = MatchAccount::empty_key();
        self.game_state = false;
        self.user_balances = [0_u64; 8];
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
    pub fn add_user_to_match(&mut self, user_key: Pubkey, user_bal: u64) {
        let empty_idx = self.look_for_empty_idx();
        if let Some(empty_idx) = empty_idx {
            self.user_keys[empty_idx] = user_key;
            self.user_balances[empty_idx] = user_bal;
        }
    }
}
//
impl<'info> InitializeEscrow<'info> {
    fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self
                .initializer_deposit_token_account
                .to_account_info()
                .clone(),
            to: self.vault_account.to_account_info().clone(),
            authority: self.user_account.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_set_authority_context(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self
                .initializer_deposit_token_account
                .to_account_info()
                .clone(),
            current_authority: self.user_account.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

// impl<'info> From<&mut InitializeEscrow<'info>>
//     for CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
//     fn from(accounts: &mut InitializeEscrow<'info>) -> Self {
//         let cpi_accounts = Transfer {
//             from: accounts
//                 .initializer_deposit_token_account
//                 .to_account_info()
//                 .clone(),
//             to: accounts.vault_account.to_account_info().clone(),
//             authority: accounts.user_as_authority.clone(),
//         };
//         CpiContext::new(accounts.token_program.clone(), cpi_accounts)
//     }
// }
//
// impl<'info> From<&mut InitializeEscrow<'info>>
//     for CpiContext<'_, '_, '_, 'info, SetAuthority<'info>>
// {
//     fn from(accounts: &mut InitializeEscrow<'info>) -> Self {
//         let cpi_accounts = SetAuthority {
//             account_or_mint: accounts
//                 .initializer_deposit_token_account
//                 .to_account_info()
//                 .clone(),
//             current_authority: accounts.initializer.clone(),
//         };
//         let cpi_program = accounts.token_program.clone();
//         CpiContext::new(cpi_program, cpi_accounts)
//     }
// }

impl<'info> AddUser<'info> {
    fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self
                .deposit_token_account
                .to_account_info()
                .clone(),
            to: self.vault_account.to_account_info().clone(),
            authority: self.user_account.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
    fn into_set_authority_context(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self.vault_account.to_account_info().clone(),
            current_authority: self.user_account.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}
