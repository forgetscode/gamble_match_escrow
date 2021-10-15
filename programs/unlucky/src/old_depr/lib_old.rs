use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, SetAuthority, TokenAccount, Transfer};
use spl_token::instruction::AuthorityType;

declare_id!("3JJwGuyPG5yiyWz5bgTGS4VdAAvHnpwinVT8ZcYVARKB");

#[program]
pub mod unlucky {
    use super::*;

    const VAULT_AUTHORITY_SEED: &[u8] = b"authority-seed";
    const RENT_AMOUNT: u64 = 4370880;

    pub fn initialize(ctx: Context<Initialize>, initializer_amount: u64) -> ProgramResult {
        // ctx.accounts.escrow_account.load();

        let (vault_authority, _vault_authority_bump) =
            Pubkey::find_program_address(&[VAULT_AUTHORITY_SEED], ctx.program_id);

        token::set_authority(
            ctx.accounts.into_set_authority_context(),
            AuthorityType::AccountOwner,
            Some(vault_authority),
        )?;

        // ctx.accounts.escrow_account.add_user_to_match(ctx.accounts.initializer.to_account_info().key(), initializer_amount);
        Ok(())
    }

    pub fn join(ctx: Context<Join>, amount: u64) -> ProgramResult {
        if ctx.accounts.escrow_account.game_state == false {
            token::transfer(
                ctx.accounts
                    .into_transfer_to_pda_context(),
                amount,
            )?;
            ctx.accounts.escrow_account.add_user_to_match(ctx.accounts.joiner.key(), amount);

            let ix = anchor_lang::solana_program::system_instruction::transfer(
                ctx.accounts.joiner.key,
                ctx.accounts.vault_handler.key,
                RENT_AMOUNT,
            );

            anchor_lang::solana_program::program::invoke(
                &ix,
                &[
                    ctx.accounts.joiner.to_account_info().clone(),
                    ctx.accounts.vault_handler.to_account_info().clone(),
                ],
            )?;

            Ok(())
        } else {
            msg!("The game has reached maximum amount of users and is starting, please create a new lobby.");
            Ok(())
        }
    }

    pub fn change_state(ctx: Context<ChangeState>) -> ProgramResult {
        ctx.accounts.escrow_account.change_state();
        Ok(())
    }

    pub fn remove_user_from_match(ctx: Context<RemoveUserFromMatch>, key: Pubkey) -> ProgramResult {
        if ctx.accounts.escrow_account.game_state == false {
            if ctx.accounts.leaver.key() == key {
                let (_, nonce) = Pubkey::find_program_address(&[VAULT_AUTHORITY_SEED], ctx.program_id);

                let return_balance = ctx.accounts.escrow_account.remove_user_from_match(ctx.accounts.leaver.key());

                let seeds = &[&VAULT_AUTHORITY_SEED[..], &[nonce]];
                let signer = &[&seeds[..]];

                let cpi_accounts = Transfer {
                    from:
                    ctx.accounts
                        .vault_handler
                        .to_account_info()
                        .clone(),
                    to: ctx.accounts.leaver_token_account.to_account_info().clone(),
                    authority: ctx.accounts.program_signer.to_account_info().clone(),
                };

                let cpi_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.clone(), cpi_accounts, signer);
                token::transfer(cpi_ctx, return_balance)?;
                Ok(())
            } else {
                msg!("Key was not found in match");
                Ok(())
            }
        } else {
            msg!("You cannot leave the lobby as the game is starting.");
            Ok(())
        }
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub initializer_deposit_token_account: Account<'info, TokenAccount>,
    // #[account(
    //     init,
    //     payer = initializer,
    //     space = 500
    // )]
    // pub escrow_account: Account<'info, MatchAccount>,
    #[account(mut)]
    pub vault_handler: AccountInfo<'info>,
    #[account(
    init,
    payer = initializer,
    token::mint = mint,
    token::authority = vault_handler,
    )]
    pub vault_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Join<'info> {
    #[account(signer, mut)]
    pub joiner: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub deposit_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_account: Account<'info, MatchAccount>,
    #[account(mut)]
    pub vault_handler: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ChangeState<'info> {
    #[account(mut)]
    pub escrow_account: Account<'info, MatchAccount>,
}

#[derive(Accounts)]
pub struct RemoveUserFromMatch<'info> {
    #[account(signer, mut)]
    pub leaver: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub leaver_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_account: Account<'info, MatchAccount>,
    #[account(mut)]
    pub vault_handler: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub program_signer: AccountInfo<'info>,
}

#[account]
pub struct MatchAccount {
    pub game_state: bool,
    pub user_balances: [u64; 8],
    pub user_keys: [Pubkey; 8],
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
        match empty_idx {
            Some(empty_idx) => {
                self.user_keys[empty_idx] = user_key;
                self.user_balances[empty_idx] = user_bal;
            }
            None => {
                self.game_state = true;
            }
        }
    }

    pub fn remove_user_from_match(&mut self, user_key: Pubkey) -> u64 {
        let position = self.user_keys.iter().position(|&key| key == user_key).unwrap();
        self.user_keys[position] = MatchAccount::empty_key();
        let return_balance = self.user_balances[position].clone();
        self.user_balances[position] = 0;
        return_balance
    }

    pub fn change_state(&mut self) {
        self.game_state = !self.game_state;
    }
}

impl<'info> Initialize<'info> {
    fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self
                .initializer_deposit_token_account
                .to_account_info()
                .clone(),
            to: self.vault_account.to_account_info().clone(),
            authority: self.initializer.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_set_authority_context(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self.vault_account.to_account_info().clone(),
            current_authority: self.vault_handler.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

impl<'info> Join<'info> {
    fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self
                .deposit_token_account
                .to_account_info()
                .clone(),
            to: self.vault_handler.to_account_info().clone(),
            authority: self.joiner.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}
