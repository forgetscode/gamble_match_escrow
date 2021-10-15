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
    remaining_accounts: &[AccountInfo],
) -> Result<Pubkey, ProgramError> {
    let ordered_user_der_keys = try_get_ordered_user_der_keys(pda_key, program_id, remaining_accounts)?;
    msg!("ordered_user_der_keys len: {}", ordered_user_der_keys.len());
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
                program_id,
            )?;
            msg!("{}", new_der_key.key());
            derived_key = Some(new_der_key);
        }
    }
    Ok(derived_key.unwrap())
}

pub fn try_get_ordered_user_der_keys(
    pda_key: &Pubkey,
    program_id: &Pubkey,
    remaining_accounts: &[AccountInfo],
) -> Result<Vec<Pubkey>, ProgramError> {
    let mut user_derived_pds: BinaryHeap<sized_key::SizedKey> = BinaryHeap::new();
    for remaining_account in remaining_accounts {
        let seeds = remaining_account.key().to_bytes().to_base58();
        let seeds = &seeds[0..32];
        let child_pda = Pubkey::create_with_seed(
            pda_key,
            seeds,
            program_id,
        )?;
        let hash_pos = as_u32_le(&child_pda.to_bytes());
        user_derived_pds.push(sized_key::SizedKey { hash_pos, pub_key: child_pda });
    }
    let sorted = user_derived_pds.into_sorted_vec();
    Ok(sorted.into_iter().map(|x| x.pub_key).collect())
}
