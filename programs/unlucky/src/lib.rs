pub mod sized_key;

use std::collections::{BinaryHeap};
use anchor_lang::prelude::*;
use rust_base58::ToBase58;

declare_id!("EmjHSYUct3Z5Sk2LUaBcFDZBbw1NU6v5NSQQzmzr6W5S");

#[program]
pub mod unlucky {

    use super::*;
    pub fn init_match(ctx: Context<Initialize>, bump: u8) -> ProgramResult {
        let remaining_accounts: &[AccountInfo] = ctx.remaining_accounts;

        ctx.accounts.match_account.subset_hash =
            compute_user_derived_hash(
                &ctx.accounts.match_account.key(),
                ctx.program_id,
                remaining_accounts
            )?;

        ctx.accounts.match_account.bump = bump;
        ctx.accounts.match_account.authority = *ctx.accounts.match_authority.key;
        ctx.accounts.match_account.is_started = false;
        Ok(())
    }

    pub fn start_match(ctx: Context<Initialize>) -> ProgramResult {
        let remaining_accounts: &[AccountInfo] = ctx.remaining_accounts;
        // validate given user accounts
        if ctx.accounts.match_account.subset_hash != compute_user_derived_hash(
            &ctx.accounts.match_account.key(),
            ctx.program_id,
            remaining_accounts
        )? {
            return Err(ProgramError::InvalidArgument);
        }
        ctx.accounts.match_account.is_started = true;
        Ok(())
    }

    pub fn end_match(ctx: Context<Initialize>) -> ProgramResult {
        let remaining_accounts: &[AccountInfo] = ctx.remaining_accounts;
        // validate given user accounts
        if ctx.accounts.match_account.subset_hash != compute_user_derived_hash(
            &ctx.accounts.match_account.key(),
            ctx.program_id,
            remaining_accounts
        )? {
            return Err(ProgramError::InvalidArgument);
        }
        // some token dispersal shit
        Ok(())
    }
}

fn as_u32_le(array: &[u8; 32]) -> u32 {
    let mut sum = 0;
    let num_segments = array.len() / 4;
    for i in 0..num_segments {
        sum += (array[0] as u32) << i * 2;
    }
    sum
}

pub fn compute_user_derived_hash(
    pda_key: &Pubkey,
    program_id: &Pubkey,
    remaining_accounts: &[AccountInfo]
) -> Result<Pubkey, ProgramError> {
    let ordered_user_der_keys = try_get_ordered_user_der_keys(pda_key, program_id, remaining_accounts)?;
    let mut derived_key: Option<Pubkey> = None;
    for ordered_user in &ordered_user_der_keys {
        let ordered_seed = ordered_user.key();
        if let None = derived_key {
            derived_key = Some(ordered_seed);
        } else {
            let seeds = ordered_seed.key().to_bytes().to_base58();
            let seeds = &seeds[0..32];
            let new_der_key = Pubkey::create_with_seed(
                &derived_key.unwrap(),
                seeds,
                program_id
            )?;
            derived_key = Some(new_der_key);
        }
    }
    Ok(derived_key.unwrap())
}

pub fn try_get_ordered_user_der_keys(
    pda_key: &Pubkey,
    program_id: &Pubkey,
    remaining_accounts: &[AccountInfo]
) -> Result<Vec<Pubkey>, ProgramError> {
    let mut user_derived_pds: BinaryHeap<sized_key::SizedKey> = BinaryHeap::new();
    for remaining_account in remaining_accounts {
        let seeds = remaining_account.key().to_bytes().to_base58();
        let seeds = &seeds[0..32];
        let child_pda = Pubkey::create_with_seed(
            pda_key,
            seeds,
            program_id
        )?;
        let hash_pos = as_u32_le(&child_pda.to_bytes());
        user_derived_pds.push(sized_key::SizedKey { hash_pos, pub_key: child_pda });
    }
    let sorted = user_derived_pds.into_sorted_vec();
    Ok(sorted.into_iter().map(|x| x.pub_key).collect())
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
        seeds=[match_authority.key().as_ref()],
        bump = bump,
        payer = server_authority,
        space = std::mem::size_of::<MatchAccount>() + 8
    )]
    pub match_account: Account<'info, MatchAccount>,
    pub system_program: Program<'info, System>
}

#[account]
pub struct MatchAccount {
    authority: Pubkey,
    bump: u8,
    is_started: bool,
    subset_hash: Pubkey
}

