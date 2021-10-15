const anchor = require('@project-serum/anchor');
const assert = require("assert");
const {TOKEN_PROGRAM_ID, Token} = require("@solana/spl-token");

class MonitorBalances {
    keypair_balances = {}

    constructor(provider) {
        this.provider = provider;
    }

    add_keypairs = async kp_names => {
        if (!Array.isArray(kp_names)) {
            throw Error("add_keypairs needs an array!");
        }
        for (const item of kp_names) {
            let kp, name;
            kp = item[0];
            name = item[1];
            await this.add_keypair(kp, name);
        }
    };
    add_keypair = async (kp, name) => {
        const balance = await this.provider.connection.getBalance(kp.publicKey);
        if (!this.keypair_balances.hasOwnProperty(kp.publicKey)) {
            this.keypair_balances[kp.publicKey] = [];
        }
        this.keypair_balances[kp.publicKey] = {
            balances: [
                ...this.keypair_balances[kp.publicKey],
                {
                    balance,
                    update_name: "init"
                }
            ],
            name: name,
            pk: kp.publicKey
        };
    }
    get_balance = async (pk, update_name) => {
        const new_balance = await this.provider.connection.getBalance(pk);
        return {
            [pk]: {
                balance: new_balance,
                update_name
            }
        };
    }
    get_new_balance = async (update_name) => {
        const new_balance_promises = [];
        for (const pk in this.keypair_balances) {
            await this.get_balance(this.keypair_balances[pk].pk, update_name);
            new_balance_promises.push(this.get_balance(this.keypair_balances[pk].pk, update_name));
        }
        return Object.assign({}, ...await Promise.all(new_balance_promises));
    };
    update_balances = async update_name => {
        const new_balances = await this.get_new_balance(update_name);
        for (const key in this.keypair_balances) {
            this.keypair_balances[key].balances = [
                new_balances[key],
                ...this.keypair_balances[key].balances
            ];
        }
    };
    log_all_changes = async () => {
        const new_balances = await this.get_new_balance("final");
        console.log(`\n######################################\n`);
        for (const [key, account] of Object.entries(this.keypair_balances)) {
            let prev = null;
            let updates = [];
            for (const balance of [
                new_balances[key],
                ...account.balances
            ].reverse()) {
                if (prev !== null) {
                    if (prev.balance !== balance.balance) {
                        updates.push(`Change in balance after ${balance.update_name} :: ${prev.balance} -> ${balance.balance}`);
                    }
                }
                prev = balance;
            }
            console.log(`Balance changes for ${account.name} <${key}>:\n${updates.join("\n")}`);
            console.log(`\n######################################\n`);
        }
    };
}

const initializerAmount = 500;

let new_ = true;
describe('unlucky', () => {
        anchor.setProvider(anchor.Provider.env());
        const provider = anchor.Provider.env();
        it('Is initialized!', async () => {
            console.log(__dirname)
            await require(`../prod/app/new_test`).do_test(provider);
        });
    }
);

// describe('unlucky', () => {
//
//   // Configure the client to use the local cluster.
//   anchor.setProvider(anchor.Provider.env());
//
//   const provider = anchor.Provider.env();
//
//   const balance_track = new MonitorBalances(provider);
//   it('Is initialized!', async () => {
//     // Add your test here.
//     const program = anchor.workspace.Unlucky;
//
//     //initialize key pair for our first user
//     const first_user = anchor.web3.Keypair.generate()
//     //initialize key pair for our second user
//     const second_user = anchor.web3.Keypair.generate()
//     //initialize key pair for the escrow account
//     const escrow_account = anchor.web3.Keypair.generate()
//     //initialize token minter to fund users with Token A
//     const token_minter = anchor.web3.Keypair.generate()
//     //initialize vault handler
//     const vault_handler = anchor.web3.Keypair.generate()
//     await balance_track.add_keypairs([
//       [provider.wallet.payer, "providerWallet"],
//       [first_user, "first_user"],
//       [second_user, "second_user"],
//       [escrow_account, "escrow_account"],
//       [vault_handler, "vault_handler"],
//       [token_minter, "token_minter"]
//     ])
//     //find pda
//     const [_pda, _nonce] = await anchor.web3.PublicKey.findProgramAddress(
//         [Buffer.from(anchor.utils.bytes.utf8.encode("authority-seed"))],
//         program.programId
//     );
//     let pda = _pda;
//
//     //set initial deposit amount for the token transfers
//     const deposit_amount = new anchor.BN(123);
//
//     //airdrop lamports to first user
//     await provider.connection.confirmTransaction(
//         await provider.connection.requestAirdrop(first_user.publicKey, 10000000000),
//         'confirmed airdrop'
//     );
//
//     //airdrop lamports to second user
//     await provider.connection.confirmTransaction(
//         await provider.connection.requestAirdrop(second_user.publicKey, 10000000000),
//         'confirmed airdrop'
//     );
//
//     //airdrop lamports to token minter
//     await provider.connection.confirmTransaction(
//         await provider.connection.requestAirdrop(token_minter.publicKey, 10000000000),
//         'confirmed airdrop'
//     );
//     await balance_track.update_balances("airdrop");
//
//     //check first users balance
//     console.log("First users balance lamports");
//     const info_first = await provider.connection.getBalance(first_user.publicKey);
//     console.log(info_first);
//
//     //check second users balance
//     console.log("Second users balance lamports");
//     const info_second = await provider.connection.getBalance(second_user.publicKey);
//     console.log(info_second);
//
//     //check token minters balance
//     console.log("token minters balance lamports");
//     const info_third = await provider.connection.getBalance(token_minter.publicKey);
//     console.log(info_third);
//
//     //token minter creates token mint A
//     mintA = await Token.createMint(
//         provider.connection,
//         token_minter,
//         token_minter.publicKey,
//         null,
//         0,
//         TOKEN_PROGRAM_ID
//     );
//
//     //check token minters balance after minting A
//     console.log("token minters lamport balance after minting A");
//     const _info_third = await provider.connection.getBalance(token_minter.publicKey);
//     console.log(_info_third);
//
//     //create token account for mintA for first user
//     first_user_token_account = await mintA.createAccount(first_user.publicKey);
//     //create token account for mintA for second user
//     second_user_token_account = await mintA.createAccount(second_user.publicKey);
//
//     //mint tokens 500 to first users token account
//     await mintA.mintTo(
//         first_user_token_account,
//         token_minter.publicKey,
//         [token_minter],
//         initializerAmount
//     );
//
//     //mint tokens 500 to first users token account
//     await mintA.mintTo(
//         second_user_token_account,
//         token_minter.publicKey,
//         [token_minter],
//         initializerAmount
//     );
//     await balance_track.update_balances("after minting");
//
//     //check token minters balance after minting A
//     console.log("token minters lamport balance after minting tokens for users");
//     const _info_fourth = await provider.connection.getBalance(token_minter.publicKey);
//     console.log(_info_fourth);
//
//     //check user balances for mintA
//     console.log("Token A balance for first user");
//     const _info_fifth = await mintA.getAccountInfo(first_user_token_account);
//     console.log(_info_fifth.amount.toNumber());
//     console.log("Token A balance for second user");
//     const _info_sixth = await mintA.getAccountInfo(second_user_token_account);
//     console.log(_info_sixth.amount.toNumber());
//
//
//     //initialize the main account
//     const tx = await program.rpc.initialize(deposit_amount ,{
//       accounts:{
//         initializer: first_user.publicKey,
//         mint: mintA.publicKey,
//         initializerDepositTokenAccount: first_user_token_account,
//         escrowAccount: escrow_account.publicKey,
//         vaultHandler: vault_handler.publicKey,
//         vaultAccount: vault_handler.publicKey,
//         systemProgram: anchor.web3.SystemProgram.programId,
//         tokenProgram: TOKEN_PROGRAM_ID,
//         rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//       },
//       signers: [ escrow_account, first_user, vault_handler],
//     });
//     await balance_track.update_balances("rpc.initialize");
//
//     console.log("escrow balance after initialize");
//     const _lamp5 = await provider.connection.getBalance(escrow_account.publicKey);
//     console.log(_lamp5);
//
//     console.log("vault handler account balance after initialize");
//     const _lamp = await provider.connection.getBalance(vault_handler.publicKey);
//     console.log(_lamp);
//
//     console.log("Vault token account owner");
//     const _info_seventh = await mintA.getAccountInfo(vault_handler.publicKey);
//     console.log(_info_seventh.owner);
//     console.log("Vault token account address");
//     console.log(_info_seventh.address);
//     console.log("vault handler address");
//     console.log(vault_handler.publicKey);
//     console.log("pda address");
//     console.log(_pda);
//
//     console.log("first user token A amount after transfer");
//     const _info_eigth = await mintA.getAccountInfo(first_user_token_account);
//     console.log(_info_eigth.amount.toNumber());
//
//     console.log("Vault token amount after transfer");
//     const _info_ninth = await mintA.getAccountInfo(vault_handler.publicKey);
//     console.log(_info_ninth.amount.toNumber());
//
//     console.log("match state after initialization");
//     const _info_tenth = await program.account.matchAccount.fetch(escrow_account.publicKey);
//     console.log(_info_tenth);
//
//     console.log("checking if pda owns vault account");
//     assert.ok(_info_seventh.owner.toString() === _pda.toString(), "failed");
//     console.log("checking if vault account has correct funds");
//     assert.ok(_info_ninth.amount.toNumber() === deposit_amount.toNumber(), "failed");
//     console.log("checking if match account was updated with initializers values");
//     assert.ok(_info_tenth.userKeys[0].toString() === first_user.publicKey.toString(), "failed");
//     assert.ok(_info_tenth.userBalances[0].toNumber() === deposit_amount.toNumber(), "failed");
//
//     const tx2 = await program.rpc.changeState({
//       accounts:{
//         escrowAccount: escrow_account.publicKey,
//       }
//     });
//     await balance_track.update_balances("rpc.changeState");
//
//     console.log("checking if change state is functional");
//     const _info_state = await program.account.matchAccount.fetch(escrow_account.publicKey);
//     assert.ok(_info_state.gameState);
//
//     const tx3 = await program.rpc.changeState({
//       accounts:{
//         escrowAccount: escrow_account.publicKey,
//       }
//     });
//     const _info_state_two = await program.account.matchAccount.fetch(escrow_account.publicKey);
//     assert.ok(!_info_state_two.gameState);
//
//     const tx4 = await program.rpc.join(deposit_amount, {
//       accounts:{
//         joiner: second_user.publicKey,
//         mint: mintA.publicKey,
//         depositTokenAccount: second_user_token_account,
//         escrowAccount: escrow_account.publicKey,
//         vaultHandler: vault_handler.publicKey,
//         tokenProgram: TOKEN_PROGRAM_ID,
//         systemProgram: anchor.web3.SystemProgram.programId,
//       },
//       signers: [second_user],
//     });
//     await balance_track.update_balances("rpc.join");
//
//     console.log("escrow balance after join");
//     const _lamp4 = await provider.connection.getBalance(escrow_account.publicKey);
//     console.log(_lamp4);
//
//     console.log("vault handler balance after join");
//     const _lamp2 = await provider.connection.getBalance(vault_handler.publicKey);
//     console.log(_lamp2);
//
//     //check first users balance after initializing the account
//     console.log("First users lamport balance after initialize transaction");
//     const _info_first = await provider.connection.getBalance(first_user.publicKey);
//     console.log(_info_first);
//
//     console.log("first user token A amount after transfer");
//     const _info_lime = await mintA.getAccountInfo(first_user_token_account);
//     console.log(_info_lime.amount.toNumber());
//
//     console.log("Second user token A amount after join");
//     const _info_dime = await mintA.getAccountInfo(second_user_token_account);
//     console.log(_info_dime.amount.toNumber());
//
//     console.log("Vault token amount after user joined");
//     const _info_mime = await mintA.getAccountInfo(vault_handler.publicKey);
//     console.log(_info_mime.amount.toNumber());
//
//     console.log("match state after second user joined");
//     const _info_eleventh = await program.account.matchAccount.fetch(escrow_account.publicKey);
//     console.log(_info_eleventh);
//
//
//     console.log("checking if first user pubkey matches matchAccount index 0");
//     assert.ok(_info_eleventh.userKeys[0].toString() === first_user.publicKey.toString(), "failed");
//
//
//     console.log("checking if first user depoit matches matchAccount amount index 0");
//     assert.ok(_info_eleventh.userBalances[0].toNumber() === deposit_amount.toNumber(), "failed");
//
//
//     console.log("checking if second user pubkey matches matchAccount index 1");
//     assert.ok(_info_eleventh.userKeys[1].toString()  === second_user.publicKey.toString(), "failed");
//
//
//     console.log("checking if second user depoit matches matchAccount amount index 1");
//     assert.ok(_info_eleventh.userBalances[0].toNumber() === deposit_amount.toNumber(), "failed");
//
//
//     console.log("Vault token account owner");
//     const _info_seventh2 = await mintA.getAccountInfo(vault_handler.publicKey);
//     console.log(_info_seventh2.owner);
//     console.log("Vault token account address");
//     console.log(_info_seventh2.address);
//
//     console.log("Vault token amount");
//     const _info_mime1 = await mintA.getAccountInfo(vault_handler.publicKey);
//     console.log(_info_mime1.amount.toNumber());
//
//     console.log("pda");
//     console.log(pda);
//
//
//     console.log("first user token A amount after transfer");
//     const _info_second_token = await mintA.getAccountInfo(second_user_token_account);
//     console.log(_info_second_token);
//
//
//     const tx5 = await program.rpc.removeUserFromMatch( second_user.publicKey,_nonce,{
//       accounts:{
//         leaver: second_user.publicKey,
//         mint: mintA.publicKey,
//         leaverTokenAccount: second_user_token_account,
//         escrowAccount: escrow_account.publicKey,
//         vaultHandler: vault_handler.publicKey,
//         tokenProgram: TOKEN_PROGRAM_ID,
//         systemProgram: anchor.web3.SystemProgram.programId,
//         programSigner: pda,
//       },
//       signers: [second_user],
//     });
//     await balance_track.update_balances("rpc.removeUserFromMatch");
//
//
//
//
//     console.log("game state after remove user");
//     const info_state_three = await program.account.matchAccount.fetch(escrow_account.publicKey);
//     console.log(info_state_three);
//     console.log(`\n\n\nVault token amount after user joined: ${_info_seventh2.amount.toNumber()}`)
//     const _info_test_three = await mintA.getAccountInfo(vault_handler.publicKey);
//     console.log(`Vault token amount after user cancelled: ${_info_test_three.amount.toNumber()}`);
//     // console.log(_info_test_three.amount.toNumber());
//
//     // console.log("Initialize signature", tx);
//     // console.log("game state switch on signature", tx2);
//     // console.log("game state switch off signature", tx3);
//     // console.log("Join signature", tx4);
//     // console.log("leave signature", tx5);
//     await balance_track.log_all_changes();
//
//   });
// });
