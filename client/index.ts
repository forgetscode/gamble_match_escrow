import * as anchor from "@project-serum/anchor";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import promise_then_catch from "promise-then-catch/lib";
// import { NodeWallet } from "@project-serum/anchor/dist/provider";

const nativeProgramAddress = new anchor.web3.PublicKey("So11111111111111111111111111111111111111112");
const provider = anchor.Provider.local();
// const localWallet = NodeWallet.local();
anchor.setProvider(provider);

const make_name_account = async () => {
    return await Token.createWrappedNativeAccount(
        provider.connection,
        TOKEN_PROGRAM_ID,
        nativeProgramAddress,
        (provider.wallet as any).payer,
        0
    );
};

const get_token_program = async () => {
    const program = anchor.workspace.GambleMatchEscrow;
    const matchAccount = anchor.web3.Keypair.generate();
    const initializerDepositTokenAccount = await make_name_account();
    const initializerReceiveTokenAccount = await make_name_account();

    const testAcc = await provider.connection.getAccountInfoAndContext(initializerDepositTokenAccount);

    console.log({ testAcc });

    await program.rpc.initialize(
        {
            accounts: {
                initializer: provider.wallet.publicKey,
                initializerDepositTokenAccount,
                initializerReceiveTokenAccount,
                matchAccount: matchAccount.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
            // instructions: [
            //     await program.account.initializerFeeAccount.createInstruction(initializerFeeAccount),
            // ],
            signers: [matchAccount],
        }
    );
    console.log({ testAcc });
};

if (require.main === module) {
    promise_then_catch(get_token_program);
}
