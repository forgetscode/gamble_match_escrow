import { CachedMint } from "./anchor_api_wrap/cached_mint";
import promise_then_catch from "promise-then-catch/lib";
import * as anchor from "@project-serum/anchor";
import { get_provider_keypair, load_program_from_idl } from "./utils/idl";
import { NodeWallet } from "./utils/provider";
import { anchor_util } from "./utils/anchor_stuff";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, SystemProgram, TokenAmount, Transaction } from "@solana/web3.js";
import { CachedKeypair } from "./anchor_api_wrap/cached_keypair";
import { SolanaAccountInfo } from "../test-react/app/src/App";
import { BetterPDA } from "./anchor_api_wrap/better_pda";
import * as fs from "fs";

if (!fs.existsSync("./data_cache")) {
    fs.mkdirSync("./data_cache");
}

process.env.ANCHOR_WALLET = get_provider_keypair();
let provider = new anchor.Provider(
    new Connection("http://127.0.0.1:8899", "processed"),
    NodeWallet.local(),
    { commitment: "processed" }
);

anchor.setProvider(provider);
let remake_all_vals = true;
export const do_test = async (new_provider: anchor.Provider) => {
    remake_all_vals = true;
    provider = new_provider;
    await do_stuff();
};

const deposit_amount = new anchor.BN(500);

const program = load_program_from_idl({ load_toml: true });
anchor_util.setProvider(provider);

const make_token_account = async (mintWrapper: CachedMint, userWallet: NodeWallet, amount = 2000) => {
    return await mintWrapper.make_token_account_for_user(
        userWallet.publicKey,
        amount
    );
};
const make_mint = async (): Promise<CachedMint> => {
    return await CachedMint.getOrCreateMint(provider, "./data_cache/mint_idl.json", remake_all_vals);
};

const create_new_match = async () => {
    return CachedKeypair.getOrCreateKp("./data_cache/match_key_idl.json", remake_all_vals);
};

const get_user_token_accs = async (mint_pub_key: PublicKey, user_wallet: NodeWallet): Promise<SolanaAccountInfo> => {
    const user_token_accounts = (await provider.connection.getTokenAccountsByOwner(
        user_wallet.publicKey,
        { mint: mint_pub_key }
    )).value;
    const valid_user_token_accounts = user_token_accounts.filter(async user_account => {
        const balance = await provider.connection.getTokenAccountBalance(user_account.pubkey, "confirmed");
        const amount = (balance.value as TokenAmount).uiAmount;
        return amount != null && amount > deposit_amount.toNumber();
    });
    if (valid_user_token_accounts.length <= 0) {
        throw new Error("no valid accounts!");
    }
    const user_token_account = valid_user_token_accounts[0];
    const bal = await provider.connection.getTokenAccountBalance(user_token_account.pubkey);
    // console.log(bal);
    // Account
    // Token.createTransferInstruction()
    return user_token_account;
};


const new_user_wallet = (user_num: number) => {
    const simulatedKeyPair = CachedKeypair.getOrCreateKp(`./data_cache/simulated_key_pair_idl_${ user_num }.json`, remake_all_vals);
    return new NodeWallet(simulatedKeyPair.kp);
};

interface UserMade {
    user: NodeWallet,
    from_token_account: PublicKey,
    to_temp_token_account: PublicKey
}


const make_temp_token_accs = async (mint: CachedMint, matchAccount: CachedKeypair, users: UserMade[], match_pda: BetterPDA) => {
    let tx = new Transaction();
    for (const acc of users) {
        const child_pda = await match_pda.get_second_order_pda(acc.user.publicKey);
        tx.add(
            Token.createTransferInstruction(
                TOKEN_PROGRAM_ID, // always token program address
                acc.from_token_account, // from (token account public key)
                acc.to_temp_token_account, // to (token account public key)
                acc.user.payer.publicKey,  // from's authority
                [], // pass signer if from's mint is a multisig pubkey
                Math.floor((Math.random() + 1) * 100) // amount
            )
        );
        tx.add(
            Token.createSetAuthorityInstruction(
                TOKEN_PROGRAM_ID,
                acc.to_temp_token_account,
                child_pda,
                "AccountOwner",
                acc.user.publicKey,
                [ acc.user.payer ]
            )
        );
    }
    tx.feePayer = provider.wallet.publicKey;
    const signers = [
        provider.wallet.payer,
        ...users.map(acc => acc.user.payer)
    ];
    console.log(`transfer & auth txhash: ${ await provider.connection.sendTransaction(tx, signers) }`);
};

const init_match = async (mint: CachedMint, matchAccount: CachedKeypair, users: UserMade[], match_pda: BetterPDA) => {
    const tx3 = await program.rpc.initMatch(match_pda.bump, {
        accounts: {
            serverAuthority: provider.wallet.publicKey,
            matchAuthority: matchAccount.publicKey,
            matchAccount: match_pda.pdaPubKey,
            systemProgram: SystemProgram.programId
        },
        signers: [ provider.wallet.payer, matchAccount ],
        // remainingAccounts: users.map(acc => ({ pubkey: acc.user.publicKey, isWritable: false, isSigner: false }))
    });
    await new Promise(r => setTimeout(r, 1000));
    const test = await program.account.matchAccount.fetch(match_pda.pdaPubKey);
    console.log(`init_match txhash: ${ tx3 }`);
};


const user_requests_new_match = async () => {
    const matchAccount = await create_new_match();
    const mint = await make_mint();
    let users: UserMade[] = [];
    for (let i = 0; i < 3; i++) {
        const user = new_user_wallet(i + 1);
        const user_token_acc = await make_token_account(mint, user, 2000);
        const temp_user_account = await make_token_account(mint, user, 0);
        users.push({
            user,
            from_token_account: user_token_acc,
            to_temp_token_account: temp_user_account
        });
    }
    const match_pda = await BetterPDA.new_pda(matchAccount.publicKey, program.programId);

    await make_temp_token_accs(mint, matchAccount, users, match_pda);
    await init_match(mint, matchAccount, users, match_pda);
};

const do_stuff = async () => {
    await user_requests_new_match();
};


if (require.main === module) {
    promise_then_catch(do_stuff);
}



