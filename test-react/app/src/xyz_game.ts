import { useConnection, useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { Dispatch, useCallback, useEffect, useMemo, useState } from "react";
import fetch from "node-fetch";
import {
    MessageSignerWalletAdapterProps,
    SignerWalletAdapterProps,
    WalletAdapterProps,
    WalletNotConnectedError
} from "@solana/wallet-adapter-base";
import { BN, Provider } from "@project-serum/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
import { AddUserArgs, Program } from "../../../app/anchor_api_wrap/idl/program_type";
import * as anchor from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { get_user_token_accs } from "./send-stuff-test";
import { useQuery } from "react-query";
import { Wallet, WalletName } from "@solana/wallet-adapter-wallets";
import temp from "../../../target/idl/unlucky.json";

// type IdlType = typeof temp;

export interface IDLType {
    version:      string;
    name:         string;
    instructions: Instruction[];
}

export interface Instruction {
    name:     string;
    accounts: Account[];
    args:     Arg[];
}

export interface Account {
    name:     string;
    isMut:    boolean;
    isSigner: boolean;
}

export interface Arg {
    name: string;
    type: string;
}

export type Some<T> = T | undefined;

interface UseSolanaGame {
    joinQueue: (address: string) => void;
}

interface Config {
    idl: any,
    mintKey: string,
    programId: string
}

export const getConfig = async (): Promise<Some<Config>> => {
    const res = await fetch("http://localhost:5000/config");
    if (res.ok) {
        return await res.json();
    }
};

// function wrapPromise<T>(promise: Promise<T>) {
//     let status = "pending";
//     let result: T;
//     let suspender = promise.then(
//         (r) => {
//             status = "success";
//             result = r;
//         },
//         (e) => {
//             status = "error";
//             result = e;
//         }
//     );
//     return {
//         read() {
//             if (status === "pending") {
//                 throw suspender;
//             } else if (status === "error") {
//                 throw result;
//             } else if (status === "success") {
//                 return result;
//             }
//         },
//     };
// }

export interface ValidatedWalletCtx extends WalletContextState {
    publicKey: PublicKey;
    wallet: Wallet;
    adapter: ReturnType<Wallet['adapter']>;
    signTransaction: (transaction: Transaction) => Promise<Transaction>
    signAllTransactions: (transaction: Transaction[]) => Promise<Transaction[]>
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
}

const validateWalletReady = (ctx: WalletContextState): ValidatedWalletCtx => {
    if (
        ctx.publicKey != null
        && ctx.wallet != null
        && ctx.adapter != null
        && ctx.signTransaction != null
        && ctx.signAllTransactions != null
        && ctx.signMessage != null
    ) {
        return ctx as ValidatedWalletCtx;
    }
    throw new WalletNotConnectedError();
};

interface PreppedProps {
    program: Program
    validatedWalletCtx: ValidatedWalletCtx
    mintKey: PublicKey
    programId: PublicKey
}

export const useSolanaGame = () => {
    const walletContextState = useWallet();
    const { connection } = useConnection();
    const config = useQuery(["config"], async () => {
        const response = await getConfig();
        if (!response) {
            throw new Error('Network response was not ok');
        }
        return response;
    });

    const validatedProps = useCallback(async (): Promise<PreppedProps> => {
        const validatedWalletCtx = validateWalletReady(walletContextState);
        while (!config.isSuccess) {
            await config.refetch();
            await new Promise(r => setTimeout(r, 500));
        }
        const provider = new Provider(
            connection,
            validatedWalletCtx,
            { commitment: "processed" }
        );
        const mintKey = new PublicKey(config.data.mintKey);
        const programId = new PublicKey(config.data.programId);
        const program = new anchor.Program(
            config.data.idl,
            programId,
            provider
        ) as unknown as Program;
        return { program, validatedWalletCtx, mintKey, programId  };
    }, [ walletContextState.publicKey, connection, config.isFetching ]);

    const onJoinMatch = useCallback(async (matchId: string) => {
        const { program, validatedWalletCtx: { publicKey }, mintKey } = await validatedProps();
        const matchKey = new PublicKey(matchId);
        const deposit_amount = 25;
        const user_token_account = await get_user_token_accs(connection, mintKey, publicKey, deposit_amount);
        const user_temp_token_address = anchor.web3.Keypair.generate();
        const add_user_accounts: AddUserArgs = {
            accounts: {
                initializer: publicKey,
                mint: mintKey,
                userAccount: publicKey,
                fromUserTokenAccount: user_token_account.pubkey,
                toTempUserTokenAccount: user_temp_token_address.publicKey,
                matchAuthority: matchKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY
            },
            signers: [ user_temp_token_address ]
        };

        console.log(add_user_accounts);

        const signature = await program.rpc.addUser(new BN(deposit_amount), add_user_accounts);

        await connection.confirmTransaction(signature, 'processed');
    }, [walletContextState.publicKey, connection]);

    return {
        onJoinMatch
    };
};






