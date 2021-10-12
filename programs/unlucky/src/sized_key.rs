use std::cmp::Ordering;
use anchor_lang::prelude::Pubkey;

impl Eq for SizedKey {}

impl PartialEq<Self> for SizedKey {
    fn eq(&self, other: &Self) -> bool {
        self.hash_pos == other.hash_pos
    }
}

impl PartialOrd<Self> for SizedKey {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for SizedKey {
    fn cmp(&self, other: &Self) -> Ordering {
        self.cmp(other)
    }
}

impl SizedKey {
    fn cmp(&self, other: &Self) -> Ordering {
        if self.hash_pos > other.hash_pos {
            Ordering::Greater
        } else {
            Ordering::Less
        }
    }
}

pub struct SizedKey {
    pub pub_key: Pubkey,
    pub hash_pos: u32
}
