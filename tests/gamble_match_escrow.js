const anchor = require("@project-serum/anchor");
const { TOKEN_PROGRAM_ID, Token } = require("@solana/spl-token");
const assert = require("assert");
const { Console } = require("console");
const process = require("process");



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
console.log(`\n\nANCHOR WALLET: ${process.env.ANCHOR_WALLET}`);
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


describe('Initialize PDA token account', () => {

  it('Initialized!', async () => {

    // const [_pda, _nonce] = await anchor.web3.PublicKey.findProgramAddress(
    //   [Buffer.from(anchor.utils.bytes.utf8.encode("authority-seed"))],
    //   program.programId
    // );

    const tx = await program.rpc.initializeEscrow(new anchor.BN(123),{
      accounts:{
        userAsAuthority: provider.wallet.publicKey,
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
    console.log({ testaccount: testaccount.publicKey.toString(), provider_key: provider.wallet.payer.publicKey.toString() })

    let _TokenAccountPDA = await mintA.getAccountInfo(provider.wallet.publicKey);
    let _TokenAccountA = await mintA.getAccountInfo(TokenAccountA);


    assert.ok(_TokenAccountPDA.amount.toNumber() + _TokenAccountA.amount.toNumber() == initializerAmount);
    /*
    let escrow_account = await program.account.matchAccount.fetch(testaccount.publicKey);
    assert.ok(escrow_account);
    */
    console.log("Your transaction signature", tx);
  });

  it('Added user!', async () => {

    const [_pda, _nonce] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode("authority-seed"))],
        program.programId
    );
    // console.log({_pda, _nonce}); // not really sure what i'm doing here but it's 5am and i'm tired yolo
    const tx = await program.rpc.addUser(new anchor.BN(123),{
      accounts:{
        userAsAuthority: provider.wallet.publicKey,
        // mint: mintA.publicKey,
        depositTokenAccount: TokenAccountA,
        escrowAccount: testaccount.publicKey,
        vaultAccount: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [provider.wallet.payer],
    });

    // let _TokenAccountPDA = await mintA.getAccountInfo(provider.wallet.publicKey);
    // let _TokenAccountA = await mintA.getAccountInfo(TokenAccountA);
    //
    //
    // assert.ok(_TokenAccountPDA.amount.toNumber() + _TokenAccountA.amount.toNumber() == initializerAmount);
    /*
    let escrow_account = await program.account.matchAccount.fetch(testaccount.publicKey);
    assert.ok(escrow_account);
    */
    console.log("Your transaction signature", tx);
  });
});
