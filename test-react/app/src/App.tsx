import './App.css';
import { useState } from 'react';
import { clusterApiUrl, ConfirmOptions, Connection, PublicKey } from '@solana/web3.js';
import { Program, Provider } from '@project-serum/anchor';
import IDL_JSON from './idl.json';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Idl } from "@project-serum/anchor/src/idl";

import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import * as anchor from '@project-serum/anchor';

type IDL = {
  metadata: {
    address: string
  }
} & Idl;
const idl = IDL_JSON as IDL;

const wallets = [ getPhantomWallet() ]


const opts: ConfirmOptions = {
  preflightCommitment: "processed"
}
const programID = new PublicKey(idl.metadata.address);


const escrow_account = anchor.web3.Keypair.generate()

const vault_handler = anchor.web3.Keypair.generate()

const deposit_amount = new anchor.BN(10000000000);

function App() {
  const [value] = useState('');

  const wallet = useWallet()

  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = clusterApiUrl('devnet');
    const connection = new Connection(network, opts.preflightCommitment);

    return new Provider(
        connection, wallet as any,
        opts
    );
  }



  async function getMint(
      provider: Provider,
      mintKey: string | PublicKey,

  ) {
    const _mintKey = typeof mintKey === "string" ? new PublicKey(mintKey) : mintKey;
    const mint = new Token(
        provider.connection,
        _mintKey,
        TOKEN_PROGRAM_ID,
        provider as any
    );
    const userTokenAccount = await mint.getAccountInfo(provider.wallet.publicKey);
    return [
        mint,
        userTokenAccount
    ];
  }

  async function initialize() {

    const provider = await getProvider();
    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(idl, programID, provider);

    let mintA = new PublicKey("BDaZrrPYF5ns5xdYTdJ8hjTsLRQouT5P1Fh9k5SJbe76");
    let user_token_account =new PublicKey("Bk5xX3fi1bdwXCrrB8c8EXy4ZQMLdCj3m2xBUvdzYzQW");

    const [_pda, _nonce] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode("authority-seed"))],
        program.programId
    );
    let pda = _pda;

    console.log(pda.toBase58());

    /* interact with the program via rpc */
    const tx = await program.rpc.initialize(deposit_amount ,{
      accounts:{
        initializer: provider.wallet.publicKey,
        mint: mintA,
        initializerDepositTokenAccount: user_token_account,
        tempTokenAccount: vault_handler.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [vault_handler],
    });


    console.log('initalize tx:', tx);

    try{
      console.log(provider.wallet.publicKey.toBase58());
    }
    catch (err){
      console.log("error!", err);
    }

  }

  async function transferToken() {
    const provider = await getProvider();
    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(idl, programID, provider);

    let mintA = new PublicKey("BDaZrrPYF5ns5xdYTdJ8hjTsLRQouT5P1Fh9k5SJbe76");
    let send_token_account = new PublicKey("GvoAdo9C7ii3m4ohjoPgtLG1BSnRyyr3GN2YZFZTdgQo");
    let reciever_token_account =new PublicKey("2z93tN6axmqi61peuaJEXy17fseHZfSayw67CsnLGCYy");

    const [_pda, _nonce] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode("authority-seed"))],
        program.programId
    );

    let pda = _pda

    const tx2 = await program.rpc.transferToken(deposit_amount, _nonce, {
      accounts:{
        mint: mintA,
        initializerTempTokenAccount: send_token_account,
        recieverTokenAccount: reciever_token_account,
        tokenProgram: TOKEN_PROGRAM_ID,
        programSigner: pda,
      },
    });

    console.log('initalize tx2:', tx2);

  }

  if (!wallet.connected) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop:'100px' }}>
          <WalletMultiButton />
        </div>
    )
  } else {
    return (
        <div className="App">
          <div>
            {
              !value && (<button onClick={initialize}>Initialize</button>)
            }
          </div>
          <div>
            {
              !value && (<button onClick={transferToken}>Transfer Token</button>)
            }
          </div>
        </div>
    );
  }
}

const AppWithProvider = () => (
    <ConnectionProvider endpoint={clusterApiUrl('devnet')}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
)

export default AppWithProvider;
