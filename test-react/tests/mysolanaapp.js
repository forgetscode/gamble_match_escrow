const anchor = require('@project-serum/anchor');
const {TOKEN_PROGRAM_ID, Token} = require("@solana/spl-token");
const assert = require("assert");
const {Console} = require("console");


const initializerAmount = 500;


describe("Mysolanaapp", () => {
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Mysolanaapp;
    it("It initializes the account", async () => {

        const escrow_account = anchor.web3.Keypair.generate()
        //initialize token minter to fund users with Token A
        const token_minter = anchor.web3.Keypair.generate()
        //initialize vault handler
        const vault_handler = anchor.web3.Keypair.generate()
        //find pda
        const [_pda, _nonce] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("authority-seed"))],
            program.programId
        );
        let pda = _pda;

        //set initial deposit amount for the token transfers
        const deposit_amount = new anchor.BN(123);


        //airdrop lamports to token minter
        await provider.connection.confirmTransaction(
            await provider.connection.requestAirdrop(token_minter.publicKey, 10000000000),
            'confirmed airdrop'
        );

        //check token minters balance
        console.log("token minters balance lamports");
        const info_third = await provider.connection.getBalance(token_minter.publicKey);
        console.log(info_third);


        //token minter creates token mint A
        mintA = await Token.createMint(
            provider.connection,
            token_minter,
            token_minter.publicKey,
            null,
            0,
            TOKEN_PROGRAM_ID
        );


        //create token account for mintA for user
        user_token_account = await mintA.createAccount(provider.wallet.publicKey);

        //mint tokens 500 to first users token account
        await mintA.mintTo(
            user_token_account,
            token_minter.publicKey,
            [token_minter],
            initializerAmount
        );

        //check token minters balance after minting A
        console.log("token minters lamport balance after minting tokens for users");
        const _info_fourth = await provider.connection.getBalance(token_minter.publicKey);
        console.log(_info_fourth);


        //initialize the main account
        const tx = await program.rpc.initialize(deposit_amount, {
            accounts: {
                initializer: provider.wallet.publicKey,
                mint: mintA.publicKey,
                initializerDepositTokenAccount: user_token_account,
                escrowAccount: escrow_account.publicKey,
                vaultHandler: vault_handler.publicKey,
                vaultAccount: vault_handler.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
            signers: [escrow_account, provider.wallet.payer, vault_handler],
        });


        console.log("vault handler account balance after initialize");
        const _lamp = await provider.connection.getBalance(vault_handler.publicKey);
        console.log(_lamp);

        console.log("escrow balance after initialize");
        const _lamp5 = await provider.connection.getBalance(escrow_account.publicKey);
        console.log(_lamp5);

        console.log("Vault token account owner");
        const _info_seventh = await mintA.getAccountInfo(vault_handler.publicKey);
        console.log(_info_seventh.owner);
        console.log("Vault token account address");
        console.log(_info_seventh.address);
        console.log("vault handler address");
        console.log(vault_handler.publicKey);
        console.log("pda address");
        console.log(_pda);

        console.log("first user token A amount after transfer");
        const _info_eigth = await mintA.getAccountInfo(user_token_account);
        console.log(_info_eigth.amount.toNumber());

        console.log("Vault token amount after transfer");
        const _info_ninth = await mintA.getAccountInfo(vault_handler.publicKey);
        console.log(_info_ninth.amount.toNumber());

        console.log("match state after initialization");
        const _info_tenth = await program.account.matchAccount.fetch(escrow_account.publicKey);
        console.log(_info_tenth);


    });
});
