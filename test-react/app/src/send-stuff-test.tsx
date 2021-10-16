import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, Keypair, PublicKey, SystemProgram, TokenAmount, Transaction } from '@solana/web3.js';
import React, { FC, useCallback } from 'react';
import * as anchor from "@project-serum/anchor";
import { BN, Provider } from "@project-serum/anchor";
import { AddUserArgs, Program } from "../../../app/anchor_api_wrap/idl/program_type";
import { useQuery } from "react-query";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { NodeWallet } from "../../../app/utils/provider";
import { SolanaAccountInfo } from "./App";
import { useSolanaGame } from "use-solana-game";


export const get_user_token_accs = async (connection: Connection, mint_pub_key: PublicKey, pub_key: PublicKey, deposit_amount: number): Promise<SolanaAccountInfo> => {
    const user_token_accounts = (await connection.getTokenAccountsByOwner(
        pub_key,
        { mint: mint_pub_key }
    )).value;
    const valid_user_token_accounts = user_token_accounts.filter(async user_account => {
        const balance = await connection.getTokenAccountBalance(user_account.pubkey, "confirmed");
        const amount = (balance.value as TokenAmount).uiAmount;
        return amount != null && amount > deposit_amount;
    });
    if (valid_user_token_accounts.length <= 0) {
        throw new Error("no valid accounts!");
    }
    return valid_user_token_accounts[0];
};

export const SendStuffTest: FC = () => {
    const x = useSolanaGame();
    const { connection } = useConnection();
    const wallet = useWallet();
    // const { publicKey, sendTransaction } = wallet;
    const config = useQuery(["config"], async () => {
        const response = await fetch('http://localhost:5050/config/');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });

    const get_match = useQuery(["match_key"], async () => {
        const response = await fetch('http://localhost:5050/get-match/');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });

    const onClick = useCallback(async () => {
        if (!wallet.publicKey) {
            throw new WalletNotConnectedError();
        }

        // tslint:disable-next-line:no-debugger
        const provider = new Provider(
            connection,
            wallet as any,
            { commitment: "processed" }
        );
        console.log(`publicKey: ${wallet.publicKey.toString()} | mintKey: ${config.data.mint}`);
        const mint_key = new PublicKey(config.data.mint);
        const program_id = new PublicKey(config.data.program_id);
        const match_key = new PublicKey(get_match.data.match_key);
        const deposit_amount = 25;
        // @ts-ignore
        const program: Program = new anchor.Program(
            config.data.idl,
            program_id,
            provider
        );

        const user_token_account = await get_user_token_accs(connection, mint_key, wallet.publicKey, deposit_amount);
        const user_temp_token_address = anchor.web3.Keypair.generate();
        const add_user_accounts: AddUserArgs = {
            accounts: {
                initializer: wallet.publicKey,
                mint: mint_key,
                userAccount: wallet.publicKey,
                fromUserTokenAccount: user_token_account.pubkey,
                toTempUserTokenAccount: user_temp_token_address.publicKey,
                matchAuthority: match_key,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY
            },
            signers: [ user_temp_token_address ]
        };

        console.log(add_user_accounts);

        const signature = await program.rpc.addUser(new BN(deposit_amount), add_user_accounts);

        await connection.confirmTransaction(signature, 'processed');
    }, [wallet.publicKey, wallet.sendTransaction, connection]);

    if (config.isLoading || get_match.isLoading) {
        return (
            <div>
                loading...
            </div>
        );
    }
    return (
        <button onClick={onClick} disabled={!wallet.publicKey}>
            Send 1 lamport to a random address!
        </button>
    );
};
