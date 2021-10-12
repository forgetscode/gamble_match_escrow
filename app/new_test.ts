import { NewMint } from "./utils/new_mint";
import promise_then_catch from "promise-then-catch/lib";
import * as anchor from "@project-serum/anchor";
import { get_provider_keypair, load_program_from_idl } from "./utils/idl";
import { NodeWallet } from "./utils/provider";
import { anchor_util } from "./utils/anchor_stuff";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, SystemProgram, TokenAmount, Transaction } from "@solana/web3.js";
import { add_match_row } from "./sqlite";
import { SavableKeypair } from "./utils/saved_keypair";
import { SolanaAccountInfo } from "../test-react/app/src/App";

process.env.ANCHOR_WALLET = get_provider_keypair();
const provider = new anchor.Provider(
    new Connection("http://127.0.0.1:8899", "processed"),
    NodeWallet.local(),
    { commitment: "processed" }
);

anchor.setProvider(provider);
const deposit_amount = new anchor.BN(500);

const program = load_program_from_idl({ load_toml: true });
anchor_util.setProvider(provider);

const make_token_account = async (mintWrapper: NewMint, userWallet: NodeWallet, amount = 2000) => {
    return await mintWrapper.make_token_account_for_user(
        userWallet.publicKey,
        amount
    );
};
const make_mint = async (): Promise<NewMint> => {
    return await NewMint.getOrCreateMint(provider, "mint_idl.json");
};

const create_new_match = async () => {
    const matchAccount = SavableKeypair.getOrCreateKp("./match_key_idl.json", true);
    await add_match_row(matchAccount);
    await init_match(matchAccount);
    return matchAccount;
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

const make_temp_token_accs = async (
    mint: NewMint,
    matchAccount: SavableKeypair,
    userAccounts: UserMade[]
) => {
    const [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode("test-seed"))],
        program.programId
    );

    let tx = new Transaction();
    for (const acc of userAccounts) {
        const newAuth = await anchor.web3.PublicKey.createWithSeed(
            pda,
            acc.user.publicKey.toString(),
            program.programId
        );
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
                newAuth,
                "AccountOwner",
                acc.user.publicKey,
                [acc.user.payer]
            )
        );
    }
    // await balance_track.update_balances("after add txn");
    tx.feePayer = provider.wallet.publicKey;
    const signers = [
        provider.wallet.payer,
        ...userAccounts.map(acc => acc.user.payer)
    ];
    console.log(`txhash: ${await provider.connection.sendTransaction(tx, signers)}`);

    // const owners = userAccounts.map(acc => acc.user.publicKey);
    // const matchAccountId = anchor_util.new_keypair();
    // const test = matchAccountId.publicKey.toString();
    // Buffer.from(matchAccountId.publicKey.toBuffer()).toString("base64")
    // console.log(test);
    // console.log(tx3);
    // await balance_track.log_all_changes();
    // const threshold = new anchor.BN(2);
    // await program.rpc.createMultisig(owners, threshold, nonce, {
    //     accounts: {
    //         multisig: multisig.publicKey,
    //         rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //     },
    //     instructions: [
    //         await program.account.multisig.createInstruction(
    //             multisig,
    //             multisigSize
    //         ),
    //     ],
    //     signers: [multisig],
    // });
    //
    // const [_pda, _nonce] = await anchor.web3.PublicKey.findProgramAddress(
    //     [Buffer.from(anchor.utils.bytes.utf8.encode("test-seed"))],
    //     program.programId
    // );
    // // const assign_params: AssignWithSeedParams = {
    // //     accountPubkey: temp_user_account,
    // //     basePubkey: user.publicKey,
    // //     programId: program.programId,
    // //     seed: "test-seed"
    // // };
    // // SystemProgram.assign(assign_params);
    // await program.rpc.startMatch({
    //     accounts: {
    //         initializer: provider.wallet.publicKey,
    //         systemProgram: anchor.web3.SystemProgram.programId,
    //         tokenProgram: TOKEN_PROGRAM_ID,
    //         // rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //         matchAccount: matchAccount.publicKey
    //     },
    //     instructions: await Promise.all(userAccounts.map(async acc => {
    //         // programId: PublicKey,
    //         //     account: PublicKey,
    //         //     newAuthority: PublicKey | null,
    //         //     authorityType: AuthorityType,
    //         //     authority: PublicKey,
    //         //     multiSigners: Array<Signer>,
    //
    //         // token_program_id: &Pubkey,
    //         //     owned_pubkey: &Pubkey,
    //         //     new_authority_pubkey: Option<&Pubkey>,
    //         //     authority_type: AuthorityType,
    //         //     owner_pubkey: &Pubkey,
    //         //     signer_pubkeys: &[&Pubkey],
    //         const newAuth = await anchor.web3.PublicKey.createWithSeed(
    //             _pda,
    //             acc.user.publicKey.toString(),
    //             program.programId
    //         );
    //         return Token.createSetAuthorityInstruction(
    //             program.programId,
    //             acc.user.publicKey,
    //             newAuth,
    //             "AccountOwner",
    //             acc.user.publicKey,
    //             [acc.user.payer]
    //         );
    //
    //     })),
    //     remainingAccounts: program.instruction.set_token_acc_owners
    //         .accounts({
    //             multisig: multisig.publicKey,
    //             multisigSigner,
    //         }).map(acc => ({ pubkey: acc.token_account })),
    //     signers: [
    //         provider.wallet.payer,
    //         ...userAccounts.map(x => x.user.payer)
    //     ]
    // });
};

const init_match = async (
    matchAccount: SavableKeypair
) => {
    const [pda, _bump] = await anchor.web3.PublicKey.findProgramAddress(
        [matchAccount.publicKey.toBuffer()],
        program.programId
    );
    const tx3 = await program.rpc.initMatch(_bump, {
        accounts: {
            initializer: provider.wallet.publicKey,
            authority: matchAccount.publicKey,
            matchAccount: pda,
            // matchAccountId: matchAccountId.publicKey,
            systemProgram: SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        signers: [ provider.wallet.payer, matchAccount ]
    });
    console.log(`txhash2: ${tx3}`);
};

const new_user_wallet = (user_num: number) => {
    const simulatedKeyPair = SavableKeypair.getOrCreateKp(`./data_cache/simulated_key_pair_idl_${user_num}.json`, true);
    return new NodeWallet(simulatedKeyPair.kp);
};


interface UserMade {
    user: NodeWallet,
    from_token_account: PublicKey,
    to_temp_token_account: PublicKey
}

const user_requests_new_match = async () => {
    const matchAccount = await create_new_match();
    const mint = await make_mint();
    let users: UserMade[] = [];
    for (let i = 0; i < 2; i++) {
        const user = new_user_wallet(i + 1);
        const user_token_acc = await make_token_account(mint, user, 2000);
        const temp_user_account = await make_token_account(mint, user, 0);
        users.push({
            user,
            from_token_account: user_token_acc,
            to_temp_token_account: temp_user_account
        });
    }

    await make_temp_token_accs(mint, matchAccount, users);
};

const do_stuff = async () => {
    await user_requests_new_match();
};



if (require.main === module) {
    promise_then_catch(do_stuff);
}



