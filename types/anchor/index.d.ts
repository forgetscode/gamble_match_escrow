// import { BN } from "@project-serum/anchor";
// import * as anchor from "@project-serum/anchor";
// import { Keypair, PublicKey } from "@solana/web3.js";
// import { Idl } from "@project-serum/anchor/src/idl";
// import { Address } from "@project-serum/anchor/src/program/common";
//
// declare module '@project-serum/anchor' {
//     type Signers = Keypair[];
//     type RemainingAccount = { pubkey: PublicKey, isMut?: boolean, isSigner?: boolean };
//     type RemainingAccounts = RemainingAccount[];
//     type AddUserAccounts = {
//         initializer: PublicKey;
//         mint: PublicKey;
//         fromUserTokenAccount: PublicKey;
//         toTempUserTokenAccount: PublicKey;
//         matchAuthority: PublicKey;
//         systemProgram: PublicKey;
//         rent: PublicKey;
//         tokenProgram: PublicKey;
//     };
//     type AddUserArgs = {
//         accounts: AddUserAccounts,
//         signers?: Signers,
//         remaining_accounts?: RemainingAccounts
//     };
//     type TransferTokenAccounts = {
//         mint: PublicKey;
//         fromTokenAccount: PublicKey;
//         toTokenAccount: PublicKey;
//         tokenProgram: PublicKey;
//         programSigner: PublicKey;
//     };
//     type TransferTokenArgs = {
//         accounts: TransferTokenAccounts,
//         signers?: Signers,
//         remaining_accounts?: RemainingAccounts
//     };
//     type LeaveAccounts = {
//         lamportRecipient: PublicKey;
//         initializerTempTokenAccount: PublicKey;
//         initializerTokenAccount: PublicKey;
//         tokenProgram: PublicKey;
//         programSigner: PublicKey;
//     };
//     type LeaveArgs = {
//         accounts: LeaveAccounts,
//         signers?: Signers,
//         remaining_accounts?: RemainingAccounts
//     };
//     interface RpcNamespace {
//         addUser: (wagerAmount: BN, named_args: AddUserArgs) => Promise<string>;
//         transferToken: (amount: BN, nonce: BN, named_args: TransferTokenArgs) => Promise<string>;
//         leave: (amount: BN, nonce: BN, named_args: LeaveArgs) => Promise<string>;
//     }
//     export class Program implements anchor.Program {
//         readonly rpc: RpcNamespace;
//         constructor(
//             public readonly idl: Idl,
//             programId: Address
//         );
//     }
// }
