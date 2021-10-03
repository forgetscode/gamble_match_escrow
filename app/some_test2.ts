import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import promise_then_catch from "promise-then-catch/lib";
import { PublicKey, Keypair } from "@solana/web3.js";
import {load_program_from_idl} from "./utils/idl";


// `\\\\wsl$\\Ubuntu\\home\\source\\our_escrow\\target\\deploy\\gamble_match_escrow-keypair.json`
process.env.ANCHOR_WALLET = "/home/charlie/.config/solana/id3.json";
// process.env.ANCHOR_WALLET = "/home/source/our_escrow/target/deploy/gamble_match_escrow-keypair.json";
const provider = anchor.Provider.local("http://127.0.0.1:8899")
anchor.setProvider(provider)

const initializerAmount = 500;

const mintAuthority = anchor.web3.Keypair.generate();
const payer = anchor.web3.Keypair.generate();

const test_mint = async () => {
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
    const tokenAccount: PublicKey = await mint.createAccount(provider.wallet.publicKey);
    // let tokenAccountInitBal = (await mintA.getAccountInfo(tokenAccount)).amount.toNumber();

    await mint.mintTo(
        tokenAccount,
        mintAuthority.publicKey,
        [mintAuthority],
        initializerAmount
    );

    let tokenAccountRefreshed = await mint.getAccountInfo(tokenAccount);
    const newTokenAccountAmount = tokenAccountRefreshed.amount.toNumber()
    console.log(`Did mint work? ${(newTokenAccountAmount === initializerAmount) ? "YES" : "NO"}`);
    return { mint, tokenAccount };
};

const init_contract = async (
    program: anchor.Program,
    tokenAccount: PublicKey,
    mint: Token
) => {
    const matchAccount = anchor.web3.Keypair.generate();
    const tx = await program.rpc.initializeEscrow(new anchor.BN(123),{
        accounts:{
            userAccount: provider.wallet.publicKey,
            mint: mint.publicKey,
            initializerDepositTokenAccount: tokenAccount,
            matchAccount: matchAccount.publicKey,
            vaultAccount: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [matchAccount],
    });
    console.log({ testaccount: matchAccount.publicKey.toString(), provider_key: provider.wallet.payer.publicKey.toString() })

    let tokenAccountPda = await mint.getAccountInfo(provider.wallet.publicKey);
    let tokenAccountRefreshed = await mint.getAccountInfo(tokenAccount);
    // program.account
    // let matchAccount = await program.account
    console.log(`Did init contract work? ${(tokenAccountPda.amount.toNumber() + tokenAccountRefreshed.amount.toNumber() == initializerAmount) ? "YES" : "NO"}`);
    console.log("Your transaction signature", tx);

    return { matchAccount };
};

const add_user = async (
    program: anchor.Program,
    tokenAccount: PublicKey,
    matchAccount: Keypair
) => {
    // const [_pda, _nonce] = await anchor.web3.PublicKey.findProgramAddress(
    //     [Buffer.from(anchor.utils.bytes.utf8.encode("authority-seed"))],
    //     program.programId
    // );
    // console.log({_pda, _nonce}); // not really sure what i'm doing here but it's 5am and i'm tired yolo
    const tx = await program.rpc.addUser(new anchor.BN(123),{
        accounts:{
            userAsAuthority: provider.wallet.publicKey,
            // mint: mintA.publicKey,
            depositTokenAccount: tokenAccount,
            escrowAccount: matchAccount.publicKey,
            vaultAccount: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [provider.wallet.payer],
    });

};

const run_ops = async () => {
    const program = load_program_from_idl("AVjAc7YszkPzzyNCJ9rNM1Vh9Ve2HpWJUbi6mztCZi6D");
    const { mint, tokenAccount } = await test_mint();
    const { matchAccount } = await init_contract(
        program,
        tokenAccount,
        mint
    );
    await add_user(
        program,
        tokenAccount,
        matchAccount
    );
};

if (require.main === module) {
    promise_then_catch(run_ops);
}

