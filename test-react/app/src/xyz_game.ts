export {};

// import { useConnection, useWallet, WalletContextState } from "@solana/wallet-adapter-react";
// import { useCallback, useEffect, useState } from "react";
// import { BN, Provider } from "@project-serum/anchor";
// import { PublicKey, Transaction } from "@solana/web3.js";
// import { AddUserArgs, Program } from "./u";
// import * as anchor from "@project-serum/anchor";
// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// import { get_user_token_accs } from "./utils/utils";
// import { useQuery } from "react-query";
// import { Wallet } from "@solana/wallet-adapter-wallets";
// import { WalletNotConnectedError } from "./utils/wallet-error";
//
// export type Some<T> = T | undefined;
//
// // type RpcHookProps = {
// //     userPubKey: PublicKey
// // };
//
// type RpcHookFn = (userPubKey: PublicKey) => Promise<void> | void;
//
// // type RpcHooks = {
// //     before?: RpcHookFn,
// //     after?: RpcHookFn
// // };
//
// // assume all hooks follow rpc calls, we can change to the above commented out type if we need more hook locations later
// interface UseSolanaGame {
//     onRpcJoinQueueComplete?: RpcHookFn;
// }
//
// interface Config {
//     idl: any,
//     mintKey: string,
//     programId: string
// }
//
// export const getConfig = async (): Promise<Some<Config>> => {
//     const res = await fetch("http://localhost:5000/config");
//     if (res.ok) {
//         return await res.json();
//     }
// };
//
// // function wrapPromise<T>(promise: Promise<T>) {
// //     let status = "pending";
// //     let result: T;
// //     let suspender = promise.then(
// //         (r) => {
// //             status = "success";
// //             result = r;
// //         },
// //         (e) => {
// //             status = "error";
// //             result = e;
// //         }
// //     );
// //     return {
// //         read() {
// //             if (status === "pending") {
// //                 throw suspender;
// //             } else if (status === "error") {
// //                 throw result;
// //             } else if (status === "success") {
// //                 return result;
// //             }
// //         },
// //     };
// // }
//
// export interface ValidatedWalletCtx extends WalletContextState {
//     publicKey: PublicKey;
//     wallet: Wallet;
//     adapter: ReturnType<Wallet['adapter']>;
//     signTransaction: (transaction: Transaction) => Promise<Transaction>
//     signAllTransactions: (transaction: Transaction[]) => Promise<Transaction[]>
//     signMessage: (message: Uint8Array) => Promise<Uint8Array>
// }
//
// const validateWalletReady = (ctx: WalletContextState): ValidatedWalletCtx => {
//     if (
//         ctx.publicKey != null
//         && ctx.wallet != null
//         && ctx.adapter != null
//         && ctx.signTransaction != null
//         && ctx.signAllTransactions != null
//         && ctx.signMessage != null
//     ) {
//         return ctx as ValidatedWalletCtx;
//     }
//     throw new WalletNotConnectedError();
// };
//
// interface PreppedProps {
//     program: Program
//     validatedWalletCtx: ValidatedWalletCtx
//     mintKey: PublicKey
//     programId: PublicKey
// }
//
// export function useSolanaGame(props?: UseSolanaGame) {
//     const walletContextState = useWallet();
//     const { connection } = useConnection();
//     const [ validatedArgs, setValidatedArgs ] = useState<Some<PreppedProps>>();
//     const config = useQuery([ "config" ], async () => {
//         const response = await getConfig();
//         if (!response) {
//             throw new Error('Network response was not ok');
//         }
//         return response;
//     });
//
//     useEffect(() => {
//         const get_validated = async () => {
//             while (!config.isSuccess) {
//                 await config.refetch();
//                 await new Promise(r => setTimeout(r, 500));
//             }
//         };
//         get_validated()
//             .then(() => {
//                 if (config.isSuccess) {
//                     const validatedWalletCtx = validateWalletReady(walletContextState);
//                     const provider = new Provider(
//                         connection,
//                         validatedWalletCtx,
//                         { commitment: "processed" }
//                     );
//                     const mintKey = new PublicKey(config.data.mintKey);
//                     const programId = new PublicKey(config.data.programId);
//                     const program = new anchor.Program(
//                         config.data.idl,
//                         programId,
//                         provider
//                     ) as unknown as Program;
//                     return setValidatedArgs({ program, validatedWalletCtx, mintKey, programId });
//                 }
//             })
//             .catch(e => console.log(e));
//     }, [ walletContextState.publicKey, connection, config.isFetching ]);
//
//     // const validatedProps = useCallback(async (): Promise<PreppedProps> => {
//     //     const validatedWalletCtx = validateWalletReady(walletContextState);
//     //     while (!config.isSuccess) {
//     //         await config.refetch();
//     //         await new Promise(r => setTimeout(r, 500));
//     //     }
//     //     const provider = new Provider(
//     //         connection,
//     //         validatedWalletCtx,
//     //         { commitment: "processed" }
//     //     );
//     //     const mintKey = new PublicKey(config.data.mintKey);
//     //     const programId = new PublicKey(config.data.programId);
//     //     const program = new anchor.Program(
//     //         config.data.idl,
//     //         programId,
//     //         provider
//     //     ) as unknown as Program;
//     //     return { program, validatedWalletCtx, mintKey, programId };
//     // }, [ walletContextState.publicKey, connection, config.isFetching ]);
//
//     const joinRpcQueue = useCallback(async (matchId: string) => {
//         if (!validatedArgs) {
//             throw new Error(`validatedArgs was null!`);
//         }
//         const { program, validatedWalletCtx: { publicKey }, mintKey } = validatedArgs;
//         // if (props?.joinQueue?.before) {
//         //     await props.joinQueue.before({
//         //         userPubKey: publicKey
//         //     })
//         // }
//         const matchKey = new PublicKey(matchId);
//         const deposit_amount = 25;
//         const user_token_account = await get_user_token_accs(connection, mintKey, publicKey, deposit_amount);
//         const user_temp_token_address = anchor.web3.Keypair.generate();
//         const add_user_accounts: AddUserArgs = {
//             accounts: {
//                 initializer: publicKey,
//                 mint: mintKey,
//                 userAccount: publicKey,
//                 fromUserTokenAccount: user_token_account.pubkey,
//                 toTempUserTokenAccount: user_temp_token_address.publicKey,
//                 matchAuthority: matchKey,
//                 systemProgram: anchor.web3.SystemProgram.programId,
//                 tokenProgram: TOKEN_PROGRAM_ID,
//                 rent: anchor.web3.SYSVAR_RENT_PUBKEY
//             },
//             signers: [ user_temp_token_address ]
//         };
//
//         console.log(add_user_accounts);
//
//         const signature = await program.rpc.addUser(new BN(deposit_amount), add_user_accounts);
//
//         await connection.confirmTransaction(signature, 'processed');
//         // if (props?.joinQueue?.after) {
//         //     await props.joinQueue.after({
//         //         userPubKey: publicKey
//         //     })
//         // }
//         if (props?.onRpcJoinQueueComplete) {
//             await props.onRpcJoinQueueComplete(publicKey)
//         }
//     }, [ walletContextState.publicKey, connection ]);
//
//     return {
//         joinRpcQueue
//     };
// }
//
//
//
//
//
//
