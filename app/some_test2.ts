import {AccountInfo, Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import promise_then_catch from "promise-then-catch/lib";
import { PublicKey, Keypair } from "@solana/web3.js";
import {get_provider_keypair, load_program_from_idl} from "./utils/idl";

import {NodeWallet} from "@project-serum/anchor/dist/esm/provider";
import {Key} from "readline";
import {Provider, Wallet} from "@project-serum/anchor";
import {log_change_in_balance} from "./utils/logging";
import {account_with_sol} from "./utils/anchor_stuff";


process.env.ANCHOR_WALLET = get_provider_keypair();
// `\\\\wsl$\\Ubuntu\\home\\source\\our_escrow\\target\\deploy\\gamble_match_escrow-keypair.json`

// process.env.ANCHOR_WALLET = "/home/source/our_escrow/target/deploy/gamble_match_escrow-keypair.json";
export const provider = anchor.Provider.local("http://127.0.0.1:8899")
anchor.setProvider(provider)

const initializerAmount = 500;

const mintAuthority = anchor.web3.Keypair.generate();
const payer = anchor.web3.Keypair.generate();

// const secondUserWallet = new NodeWallet(secondUser);
// await secondUserWallet.signTransaction()
const test_mint = async (secondUser: Keypair) => {
    await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(payer.publicKey, 10000000000),
        "confirmed"
    );

    //Create mintA, payer address pays, mintAuthority address gets authority
    const mint: Token = await Token.createMint(
        provider.connection,
        payer,
        mintAuthority.publicKey,
        null,
        0,
        TOKEN_PROGRAM_ID
    );

    //Create Token account A for providers wallet
    const tokenAccountA: PublicKey = await mint.createAccount(provider.wallet.publicKey);
    const tokenAccountB = await mint.createAccount(secondUser.publicKey);
    // let tokenAccountInitBal = (await mintA.getAccountInfo(tokenAccount)).amount.toNumber();

    await mint.mintTo(
        tokenAccountA,
        mintAuthority.publicKey,
        [mintAuthority],
        initializerAmount
    );

    await mint.mintTo(
        tokenAccountB,
        mintAuthority.publicKey,
        [mintAuthority],
        initializerAmount
    );

    let tokenAccountRefreshed = await mint.getAccountInfo(tokenAccountA);
    const newTokenAccountAmount = tokenAccountRefreshed.amount.toNumber()
    console.log(`Did mint work? ${(newTokenAccountAmount === initializerAmount) ? "YES" : "NO"}`);
    return { mint, tokenAccountA, tokenAccountB };
};

interface InitContractArgs {
    program: anchor.Program,
    tokenAccountA: PublicKey,
    mint: Token
}
const init_contract = async ({ program, tokenAccountA, mint }: InitContractArgs) => {
    // const payer2 = anchor.web3.Keypair.generate();

    const balance_logger = await log_change_in_balance(provider, provider.wallet.publicKey);
    // const balance = await provider.connection.getBalance(payer2.publicKey) / sol_divisor;
    // console.log(balance);
    const takeAmount = new anchor.BN(500);
    const matchAccount = await account_with_sol();
    const [_pda, _nonce] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode("authority-seed"))],
        program.programId
    );
    const tx = await program.rpc.initializeEscrow(takeAmount,{
        accounts:{
            userAccount: provider.wallet.publicKey,
            mint: mint.publicKey,
            initializerDepositTokenAccount: tokenAccountA,
            matchAccount: matchAccount.publicKey,
            vaultAccount: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        signers: [matchAccount, provider.wallet.payer],
    });
    // const balance_after = await provider.connection.getBalance(provider.wallet.publicKey) / sol_divisor;
    await balance_logger();
    console.log()
    // let _TokenAccountPDA = await mint.getAccountInfo(provider.wallet.publicKey);
    // let _TokenAccountA = await mint.getAccountInfo(TokenAccountA);
    // const tx = await program.rpc.initializeEscrow(new anchor.BN(123),{
    //     accounts:{
    //         userAccount: provider.wallet.publicKey,
    //         mint: mint.publicKey,
    //         initializerDepositTokenAccount: tokenAccount,
    //         matchAccount: matchAccount.publicKey,
    //         vaultAccount: provider.wallet.publicKey,
    //         systemProgram: anchor.web3.SystemProgram.programId,
    //         tokenProgram: TOKEN_PROGRAM_ID,
    //         rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //     },
    //     signers: [matchAccount],
    // });
    console.log({ testaccount: matchAccount.publicKey.toString(), provider_key: provider.wallet.payer.publicKey.toString() })

    let tokenAccountPda = await mint.getAccountInfo(provider.wallet.publicKey);
    let tokenAccountRefreshed = await mint.getAccountInfo(tokenAccountA);
    // program.account
    // let matchAccount = await program.account
    console.log(`Did init contract work? ${(tokenAccountPda.amount.toNumber() + tokenAccountRefreshed.amount.toNumber() == initializerAmount) ? "YES" : "NO"}`);
    console.log("Your transaction signature", tx);

    return { matchAccount, tokenAccountPda };
};

interface AddUserArgs {
    mint: Token,
    program: anchor.Program,
    tokenAccountB: PublicKey,
    matchAccount: Keypair,
    tokenAccountPda: AccountInfo,
    secondUser: Keypair
}

const add_user = async ({ mint, program, secondUser, tokenAccountB, matchAccount, tokenAccountPda }: AddUserArgs) => {
    const balance_logger = await log_change_in_balance(provider, secondUser);
    const depositTokenAccount = await mint.getAccountInfo(tokenAccountB);
    const tx2 = await program.rpc.addUser(new anchor.BN(123),{
        accounts:{
            addUserAccount: secondUser.publicKey,
            mint: mint.publicKey,
            depositTokenAccount: depositTokenAccount,
            matchAccount: matchAccount.publicKey,
            vaultAccount: tokenAccountPda.address,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [secondUser],
    });
    await balance_logger();
    console.log("Your transaction signature", tx2);
};

const run_ops = async () => {
    const program = load_program_from_idl({ load_toml: true });
    const secondUser = await account_with_sol();
    const { mint, tokenAccountA, tokenAccountB } = await test_mint(secondUser);
    const { matchAccount, tokenAccountPda } = await init_contract({
        program,
        tokenAccountA,
        mint
    });
    // await add_user({
    //     mint,
    //     program,
    //     secondUser,
    //     tokenAccountB,
    //     matchAccount,
    //     tokenAccountPda
    // });
};

if (require.main === module) {
    promise_then_catch(run_ops);
}

