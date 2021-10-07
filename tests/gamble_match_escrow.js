const anchor = require("@project-serum/anchor");
const { TOKEN_PROGRAM_ID, Token } = require("@solana/spl-token");
const assert = require("assert");
const { Console } = require("console");




const provider = anchor.Provider.local()

anchor.setProvider(provider)

const program = anchor.workspace.GambleMatchEscrow;



//initialize token to test
let mintA = null;

let TokenAccountA = null;
let TokenAccountB = null;

const initializerAmount = 500;

const mintAuthority = anchor.web3.Keypair.generate();

const payer = anchor.web3.Keypair.generate();

const secondUser = anchor.web3.Keypair.generate();

let pda = null;

//test account is being used to create a pubkey for the match account data
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
  TokenAccountB = await mintA.createAccount(secondUser.publicKey);

  await mintA.mintTo(
    TokenAccountA,
    mintAuthority.publicKey,
    [mintAuthority],
    initializerAmount
  );

  await mintA.mintTo(
    TokenAccountB,
    mintAuthority.publicKey,
    [mintAuthority],
    initializerAmount
  );

  let _TokenAccountA = await mintA.getAccountInfo(TokenAccountA);
  assert.ok(_TokenAccountA.amount.toNumber() == initializerAmount);

});


it('Initialized!', async () => {

  /*
  const [_pda, _nonce] = await anchor.web3.PublicKey.findProgramAddress(
     [Buffer.from(anchor.utils.bytes.utf8.encode("authority-seed"))],
     program.programId
  );
  */

  const tx = await program.rpc.initializeEscrow(new anchor.BN(123),{
    accounts:{
      userAccount: provider.wallet.publicKey,
      mint: mintA.publicKey,
      initializerDepositTokenAccount: TokenAccountA,
      matchAccount: testaccount.publicKey, 
      vaultAccount: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    },
    signers: [testaccount, provider.wallet.payer],
  });

  let _TokenAccountPDA = await mintA.getAccountInfo(provider.wallet.publicKey);
  let _TokenAccountA = await mintA.getAccountInfo(TokenAccountA);

  assert.ok(_TokenAccountPDA.amount.toNumber() + _TokenAccountA.amount.toNumber() == initializerAmount);
  console.log("Your transaction signature", tx);


  let _TokenAccountB = await mintA.getAccountInfo(TokenAccountB);
  console.log(_TokenAccountB);
  console.log(secondUser);

  //make sure Mint matches mint
  const tx2 = await program.rpc.addUser(new anchor.BN(123),{
    accounts:{
      userAccount: secondUser.publicKey,
      mint: mintA.publicKey,
      depositTokenAccount: TokenAccountB,
      matchAccount: testaccount.publicKey,
      vaultAccount: _TokenAccountPDA.address,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    },
    signers: [secondUser],
  });

  assert.ok(true);
  console.log("Your transaction signature", tx2);
  
});

  

  // let _TokenAccountPDA = await mintA.getAccountInfo(provider.wallet.publicKey);
  // let _TokenAccountA = await mintA.getAccountInfo(TokenAccountA);
  //
  //
  // assert.ok(_TokenAccountPDA.amount.toNumber() + _TokenAccountA.amount.toNumber() == initializerAmount);
  // let escrow_account = await program.account.matchAccount.fetch(testaccount.publicKey);
  // assert.ok(escrow_account);

