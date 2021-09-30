const anchor = require("@project-serum/anchor");
const { TOKEN_PROGRAM_ID, Token } = require("@solana/spl-token");
const assert = require("assert");



const provider = anchor.Provider.local()

anchor.setProvider(provider)

const program = anchor.workspace.GambleMatchEscrow;

const testaccount = anchor.web3.Keypair.generate()

describe('gamble_match_escrow', () => {

  // Configure the client to use the local cluster.
  

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initializeEscrow( {
      accounts:{
        escrowAccount: testaccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [testaccount],
    });


    let escrow_account = await program.account.matchAccount.fetch(testaccount.publicKey);
    
    assert.ok(escrow_account);
    console.log("Your transaction signature", tx);
  });
});
