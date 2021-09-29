const assert = require('assert');
const anchor = require('@project-serum/anchor');
const { SystemProgram } = anchor.web3;



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
        escrow_account: testaccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [testaccount],
    });

    let escrow_account = await program.account.testaccount.fetch(testaccount.publicKey)

    assert.ok(escrow_account);
    console.log("Your transaction signature", tx);
  });
});
