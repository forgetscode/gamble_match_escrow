const anchor = require("@project-serum/anchor");
const { TOKEN_PROGRAM_ID, Token } = require("@solana/spl-token");
const assert = require("assert");



const provider = anchor.Provider.local()

anchor.setProvider(provider)

const program = anchor.workspace.GambleMatchEscrow;



//initialize token to test
let mintA = null;
let TokenAccountA = null
const initializerAmount = 500;

const mintAuthority = anchor.web3.Keypair.generate();
const payer = anchor.web3.Keypair.generate();

let pda = null;


const testaccount = anchor.web3.Keypair.generate()
const testtokenaccount = anchor.web3.Keypair.generate()

it('test mint', async () => {
  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(payer.publicKey, 10000000000),
    "confirmed"
  );

  //Create mintA, payer address pays, mintAuthority address gets authority
  mintA = await Token.createMint(
    provider.connection,
    payer,
    mintAuthority.publicKey,
    null,
    0,
    TOKEN_PROGRAM_ID
  );

  //Create Token account A for providers wallet
  TokenAccountA = await mintA.createAccount(provider.wallet.publicKey);

  await mintA.mintTo(
    TokenAccountA,
    mintAuthority.publicKey,
    [mintAuthority],
    initializerAmount
  );

  

  let _TokenAccountA = await mintA.getAccountInfo(TokenAccountA);
  assert.ok(_TokenAccountA.amount.toNumber() == initializerAmount);

});



describe('gamble_match_escrow', () => {

  // Configure the client to use the local cluster.

  it('Is initialized!', async () => {
    // Add your test here.
    //create Token account for mint A

    const [_pda, _nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("authority-seed"))],
      program.programId
    );

    /*
    let TokenAccountPDA = await mintA.createAccount(_pda);
    let _TokenAccountPDA = await mintA.getAccountInfo(TokenAccountPDA);
    */

    let _TokenAccountA = await mintA.getAccountInfo(TokenAccountA)


    const tx = await program.rpc.initializeEscrow(new anchor.BN(123),{
      accounts:{
        initializer: provider.wallet.publicKey,
        mint: mintA.publicKey,
        initializerDepositTokenAccount: TokenAccountA,
        escrowAccount: testaccount.publicKey, 
        vaultAccount: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [testaccount, provider.wallet.payer],
    });

    
    let escrow_account = await program.account.matchAccount.fetch(testaccount.publicKey);

    let _TokenAccountA2 = await mintA.getAccountInfo(_pda)
    console.log(_TokenAccountA2);

    assert.ok(escrow_account);

    //let vault_account = await program.account.matchAccount.fetch(testaccount.publicKey);

    console.log("Your transaction signature", tx);
  });
});
