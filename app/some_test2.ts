import {AccountInfo, Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import promise_then_catch from "promise-then-catch/lib";
import { PublicKey, Keypair, Transaction, SystemProgram } from "@solana/web3.js";
import {get_provider_keypair, load_program_from_idl} from "./utils/idl";

import {NodeWallet} from "@project-serum/anchor/dist/esm/provider";
import {Key} from "readline";
import { BN, Provider, Wallet } from "@project-serum/anchor";
import {log_change_in_balance} from "./utils/logging";
import {account_with_sol} from "./utils/anchor_stuff";
import * as fs from "fs";


process.env.ANCHOR_WALLET = get_provider_keypair();
// `\\\\wsl$\\Ubuntu\\home\\source\\our_escrow\\target\\deploy\\gamble_match_escrow-keypair.json`

process.env.ANCHOR_WALLET = "/home/source/escrow2/target/deploy/unlucky-keypair.json";
export const provider = anchor.Provider.local("https://api.devnet.solana.com", { commitment: "processed" })
anchor.setProvider(provider)

console.log(JSON.parse(JSON.stringify({
    publicKey: provider.wallet.payer.publicKey.toBytes(),
    privateKey: provider.wallet.payer.secretKey
})))

console.log()


//
// const test_thing = async () => {
//     const transaction = new Transaction().add(
//         SystemProgram.transfer({
//             fromPubkey: provider.wallet.publicKey,
//             toPubkey: Keypair.generate().publicKey,
//             lamports: 1
//         })
//     );
//
//     const signature = await provider.connection.sendTransaction(transaction, [ provider.wallet.payer ]);
//
//     await provider.connection.confirmTransaction(signature, 'processed');
// };
//
// promise_then_catch(test_thing);


const initializerAmount = 500;

const mintAuthority = anchor.web3.Keypair.generate();
const receiver = anchor.web3.Keypair.generate();
const payer = anchor.web3.Keypair.generate();


// const browserWallet = Keypair.fromSecretKey(new TextEncoder().encode("2s6vWhdfE3yWZW3a3bYeXswwsyaFMRkGMEshz8BPGFMnRVnESiqNiaxNgAqX41Sf2BPdLmUzB8jv7KvScJheFsf1"))
//
// console.log()
const idl = {
    "version": "0.0.0",
    "name": "unlucky",
    "instructions": [
        {
            "name": "initialize",
            "accounts": [
                {
                    "name": "initializer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "mint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "initializerDepositTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "escrowAccount",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "vaultHandler",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultAccount",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "initializerAmount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "join",
            "accounts": [
                {
                    "name": "joiner",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "mint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "depositTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "escrowAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultHandler",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "changeState",
            "accounts": [
                {
                    "name": "escrowAccount",
                    "isMut": true,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "removeUserFromMatch",
            "accounts": [
                {
                    "name": "leaver",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "mint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "leaverTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "escrowAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultHandler",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "programSigner",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "key",
                    "type": "publicKey"
                }
            ]
        }
    ],
    "accounts": [
        {
            "name": "MatchAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "gameState",
                        "type": "bool"
                    },
                    {
                        "name": "userBalances",
                        "type": {
                            "array": [
                                "u64",
                                8
                            ]
                        }
                    },
                    {
                        "name": "userKeys",
                        "type": {
                            "array": [
                                "publicKey",
                                8
                            ]
                        }
                    }
                ]
            }
        }
    ]
};

// Address of the deployed program.
const programId = new anchor.web3.PublicKey('3JJwGuyPG5yiyWz5bgTGS4VdAAvHnpwinVT8ZcYVARKB');

// Generate the program client from IDL.
const program = new anchor.Program(idl as any, programId);
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
    const tokenAccountA: PublicKey = await mint.createAccount(new PublicKey("ARPm93GgEbKyWD8b9Xi5y5E9418ZvMRJDLUYi45MeMKy"));
    const tokenAccountB = await mint.createAccount(secondUser.publicKey);
    // let tokenAccountInitBal = (await mintA.getAccountInfo(tokenAccount)).amount.toNumber();
    fs.writeFileSync("./saved.txt", JSON.stringify({
        receiver: receiver.publicKey.toBase58(),
        mintAuthority: mintAuthority.publicKey.toBase58(),
        tokenAccountA: tokenAccountA.toBase58(),
        tokenAccountB: tokenAccountB.toBase58(),
        secondUser: secondUser.publicKey.toBase58()
    }), { encoding: "utf-8" });
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
    return { mint, tokenAccountA, tokenAccountB: null };
};

interface InitContractArgs {
    program: anchor.Program,
    tokenAccountA: PublicKey,
    mint: PublicKey
}
const init_contract = async ({ program, tokenAccountA, mint }: InitContractArgs) => {
    // const payer2 = anchor.web3.Keypair.generate();

    // const balance_logger = await log_change_in_balance(provider, provider.wallet.publicKey);
    // const balance = await provider.connection.getBalance(payer2.publicKey) / sol_divisor;
    // console.log(balance);
    const takeAmount = new anchor.BN(500);
    // const matchAccount = await account_with_sol();
    const [_pda, _nonce] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode("authority-seed"))],
        program.programId
    );
    const escrow_account = anchor.web3.Keypair.generate();
    // const mintAuthority = anchor.web3.Keypair.generate();
    const vault_handler = anchor.web3.Keypair.generate();
    const tx = await program.rpc.initialize(takeAmount, {
        accounts:{
            initializer: provider.wallet.publicKey,
            mint: mint,
            initializerDepositTokenAccount: tokenAccountA,
            escrowAccount: escrow_account.publicKey,
            vaultHandler: vault_handler.publicKey,
            vaultAccount: vault_handler.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [escrow_account, provider.wallet.payer, vault_handler],
        // instructions: [
        //     await program.account.matchAccount.createInstruction(escrow_account)
        // ]
    });
    // const balance_after = await provider.connection.getBalance(provider.wallet.publicKey) / sol_divisor;
    // await balance_logger();
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
    // console.log({ testaccount: escrow_account.publicKey.toString(), provider_key: provider.wallet.payer.publicKey.toString() })

    // let tokenAccountPda = await mint.getAccountInfo(provider.wallet.publicKey);
    // let tokenAccountRefreshed = await mint.getAccountInfo(tokenAccountA);
    // program.account
    // let matchAccount = await program.account
    // console.log(`Did init contract work? ${(tokenAccountPda.amount.toNumber() + tokenAccountRefreshed.amount.toNumber() == initializerAmount) ? "YES" : "NO"}`);
    // console.log("Your transaction signature", tx);
    //
    // return { matchAccount, tokenAccountPda };
};

interface AddUserArgs {
    mint: Token,
    program: anchor.Program,
    tokenAccountB: PublicKey,
    matchAccount: Keypair,
    tokenAccountPda: AccountInfo,
    secondUser: Keypair
}
// const {
//     receiver,
//     mintAuthority,
//     tokenAccountA,
//     tokenAccountB
// } = JSON.parse(`{"receiver":{"_keypair":{"publicKey":{"0":118,"1":252,"2":189,"3":127,"4":143,"5":90,"6":189,"7":66,"8":246,"9":32,"10":147,"11":89,"12":237,"13":47,"14":23,"15":151,"16":132,"17":88,"18":192,"19":230,"20":161,"21":83,"22":230,"23":161,"24":15,"25":54,"26":65,"27":237,"28":25,"29":152,"30":175,"31":115},"secretKey":{"0":38,"1":214,"2":143,"3":119,"4":46,"5":186,"6":77,"7":241,"8":226,"9":255,"10":134,"11":163,"12":137,"13":111,"14":86,"15":214,"16":212,"17":119,"18":225,"19":129,"20":128,"21":138,"22":18,"23":93,"24":234,"25":48,"26":31,"27":127,"28":129,"29":207,"30":189,"31":71,"32":118,"33":252,"34":189,"35":127,"36":143,"37":90,"38":189,"39":66,"40":246,"41":32,"42":147,"43":89,"44":237,"45":47,"46":23,"47":151,"48":132,"49":88,"50":192,"51":230,"52":161,"53":83,"54":230,"55":161,"56":15,"57":54,"58":65,"59":237,"60":25,"61":152,"62":175,"63":115}}},"mintAuthority":{"_keypair":{"publicKey":{"0":119,"1":195,"2":163,"3":171,"4":48,"5":136,"6":214,"7":105,"8":68,"9":212,"10":133,"11":134,"12":134,"13":226,"14":171,"15":224,"16":149,"17":171,"18":116,"19":17,"20":118,"21":166,"22":139,"23":126,"24":166,"25":156,"26":105,"27":82,"28":38,"29":85,"30":28,"31":55},"secretKey":{"0":49,"1":175,"2":0,"3":8,"4":146,"5":33,"6":177,"7":97,"8":20,"9":113,"10":168,"11":47,"12":99,"13":227,"14":159,"15":10,"16":64,"17":128,"18":213,"19":1,"20":122,"21":4,"22":180,"23":124,"24":4,"25":231,"26":129,"27":143,"28":179,"29":110,"30":125,"31":30,"32":119,"33":195,"34":163,"35":171,"36":48,"37":136,"38":214,"39":105,"40":68,"41":212,"42":133,"43":134,"44":134,"45":226,"46":171,"47":224,"48":149,"49":171,"50":116,"51":17,"52":118,"53":166,"54":139,"55":126,"56":166,"57":156,"58":105,"59":82,"60":38,"61":85,"62":28,"63":55}}},"tokenAccountA":{"_bn":"5b74d31a882e31a6c1f57ee5460012050ccfb4469b651b0700b191f9626d4f4d"},"tokenAccountB":{"_bn":"3c0e449626e7b50228e992fe30a00e1890c01bed5ea25fea10eda19020fdebc0"}}`);

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
    const escrow_account = anchor.web3.Keypair.generate();
    const vault_handler = anchor.web3.Keypair.generate();
    // console.log(program)
    const secondUser = anchor.web3.Keypair.generate();
    // const { mint, tokenAccountA, tokenAccountB } = await test_mint(secondUser);
    const {
        receiver,
        mintAuthority,
        tokenAccountA,
        tokenAccountB
    } = JSON.parse(`{"receiver":"65qLmotQZcH1WhmRuSpsUzZ27pDDeMRqt6TGPNPAs7tL","mintAuthority":"HeYFqMGbzv5HA8635QiZG6m7H9joogfXXJgdcJQoCg26","tokenAccountA":"AA7VLFRQqs35jc2Ra4YhJj6EnCxy2tPWwNLc9eJyHCEc","tokenAccountB":"h5CCVWoygzBUK3UssaSGyTaB8KNNbFZqKcjVF8huT4W","secondUser":"BfPommPUkXaoBrfxzN4QRYCsUfMvv8KNpeMqsJWkHkTN"}`);

    const first_user = new PublicKey("ARPm93GgEbKyWD8b9Xi5y5E9418ZvMRJDLUYi45MeMKy");
    // const txn = program.transaction.initialize(new BN(123), {
    //     accounts:{
    //         initializer: first_user,
    //         mint: mintAuthority.publicKey,
    //         initializerDepositTokenAccount: tokenAccountA,
    //         escrowAccount: escrow_account.publicKey,
    //         vaultHandler: vault_handler.publicKey,
    //         vaultAccount: vault_handler.publicKey,
    //         systemProgram: anchor.web3.SystemProgram.programId,
    //         tokenProgram: TOKEN_PROGRAM_ID,
    //         rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //     },
    //     signers: [ escrow_account, vault_handler ],
    // });
    // console.log(txn)
    await init_contract({
        program,
        tokenAccountA: new PublicKey(tokenAccountA),
        mint: new PublicKey(mintAuthority)
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

