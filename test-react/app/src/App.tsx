import './App.css';
import React, { useState } from 'react';
import * as solana from '@solana/web3.js';
import { clusterApiUrl, ConfirmOptions, Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { Program, Provider } from '@project-serum/anchor';
import IDL_JSON from './idl.json';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Idl } from "@project-serum/anchor/src/idl";

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Wallet } from "./wallet_provider";
import { QueryClient, QueryClientProvider } from "react-query";

// mint:"BDaZrrPYF5ns5xdYTdJ8hjTsLRQouT5P1Fh9k5SJbe76"
// wallet_one:"5XV5C37DwqzZ9Gz6EhajXoUSVzsV1EfJvec1ygM2BESH" token_account:"Bk5xX3fi1bdwXCrrB8c8EXy4ZQMLdCj3m2xBUvdzYzQW"
// wallet_two:"DfT3LJ75YTamopdp9grXpUv3ZrtqGfsDiJghBKn5DJbB" token_account "2z93tN6axmqi61peuaJEXy17fseHZfSayw67CsnLGCYy"

type IDL = {
    metadata: {
        address: string
    }
} & Idl;
const idl = IDL_JSON as IDL;

const wallets = [ getPhantomWallet() ];


const opts: ConfirmOptions = {
    preflightCommitment: "processed"
};

const programID = new PublicKey(idl.metadata.address);


const temp_token_account = anchor.web3.Keypair.generate();

const deposit_amount = new anchor.BN(10000000000);

export type SolanaAccountInfo = {
    pubkey: PublicKey,
    account: solana.AccountInfo<Buffer>
};

function App() {
    const [ value ] = useState('');

    const [ initialized_temp_token, set_initialized_temp_token ] = useState<SolanaAccountInfo>();

    const wallet = useWallet();

    async function getProvider() {
        /* create the provider and return it to the caller */
        /* network set to local network for now */
        const network = clusterApiUrl('devnet');
        const connection = new Connection(network, opts.preflightCommitment);

        return new Provider(
            connection,
            wallet as any,
            opts
        );
    }


    async function initialize() {
        // tslint:disable-next-line:no-debugger
        debugger;

        const provider = await getProvider();
        /* create the program interface combining the idl, program ID, and provider */
        const program = new Program(idl, programID, provider);
        // const [ mint, user_token_account ] = await getMint(provider, "BDaZrrPYF5ns5xdYTdJ8hjTsLRQouT5P1Fh9k5SJbe76");
        // let mintA = new PublicKey("BDaZrrPYF5ns5xdYTdJ8hjTsLRQouT5P1Fh9k5SJbe76");
        // let user_token_account = new PublicKey("Bk5xX3fi1bdwXCrrB8c8EXy4ZQMLdCj3m2xBUvdzYzQW");


        const userTokenAccount = await provider.connection.getTokenAccountsByOwner(provider.wallet.publicKey, { mint: new PublicKey("BDaZrrPYF5ns5xdYTdJ8hjTsLRQouT5P1Fh9k5SJbe76") });

        console.log(userTokenAccount.value[0].pubkey);


        const [ _pda, _nonce ] = await anchor.web3.PublicKey.findProgramAddress(
            [ Buffer.from(anchor.utils.bytes.utf8.encode("authority-seed")) ],
            program.programId
        );
        let pda = _pda;

        console.log(pda.toBase58());

        /* interact with the program via rpc */

        let mint = new PublicKey("BDaZrrPYF5ns5xdYTdJ8hjTsLRQouT5P1Fh9k5SJbe76");

        const tx = await program.rpc.initialize(deposit_amount, {
            accounts: {
                initializer: provider.wallet.publicKey,
                mint: new PublicKey("BDaZrrPYF5ns5xdYTdJ8hjTsLRQouT5P1Fh9k5SJbe76"),
                initializerDepositTokenAccount: userTokenAccount.value[0].pubkey,
                tempTokenAccount: temp_token_account.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY
            },
            signers: [ temp_token_account ]
        });


        set_initialized_temp_token(userTokenAccount.value[0]);

        console.log(initialized_temp_token);

        // console.log('initalize tx:', tx);

        try {
            console.log(provider.wallet.publicKey.toBase58());
        } catch (err) {
            console.log("error!", err);
        }

    }

    async function transferToken() {
        const provider = await getProvider();
        /* create the program interface combining the idl, program ID, and provider */
        const program = new Program(idl, programID, provider);

        let mintA = new PublicKey("2o4wvUNpwLq3k1uLF1Xibn5esYCg2wG5rXSu9WJLK7mA");
        let send_token_account = initialized_temp_token;
        let reciever_token_account = new PublicKey("2z93tN6axmqi61peuaJEXy17fseHZfSayw67CsnLGCYy");

        console.log(initialized_temp_token);


        const [ _pda, _nonce ] = await anchor.web3.PublicKey.findProgramAddress(
            [ Buffer.from(anchor.utils.bytes.utf8.encode("authority-seed")) ],
            program.programId
        );

        const t = program.rpc.transferToken;
        // @ts-ignore
        const tx2 = await program.rpc.transferToken(deposit_amount, _nonce, {
            accounts: {
                mint: mintA,
                initializerTempTokenAccount: send_token_account?.pubkey,
                recieverTokenAccount: reciever_token_account,
                tokenProgram: TOKEN_PROGRAM_ID,
                programSigner: _pda
            }
        });

        console.log('initalize tx2:', tx2);

    }

    if (!wallet.connected) {
        return (
            <div style={ { display: 'flex', justifyContent: 'center', marginTop: '100px' } }>
                <WalletMultiButton/>
            </div>
        );
    } else {
        return (
            <div className="App">
                <div>
                    {
                        !value && (<button onClick={ initialize }>Initialize</button>)
                    }
                </div>
                <div>
                    {
                        !value && (<button onClick={ transferToken }>Transfer Token</button>)
                    }
                </div>
            </div>
        );
    }
}
const queryClient = new QueryClient();
const AppWithProvider = () => (
    <QueryClientProvider client={queryClient}>
        <Wallet/>
    </QueryClientProvider>
    // <ConnectionProvider endpoint={ clusterApiUrl('devnet') }>
    //     <WalletProvider wallets={ wallets } autoConnect>
    //         <WalletModalProvider>
    //             <App/>
    //         </WalletModalProvider>
    //     </WalletProvider>
    // </ConnectionProvider>
);

export default AppWithProvider;
