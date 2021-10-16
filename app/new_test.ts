import { ConstantType, get_c } from "./setup_const";
const c: ConstantType = get_c();
const { provider, program, deposit_amount, remake_all_vals } = c;
import promise_then_catch from "promise-then-catch/lib";
import * as anchor from "@project-serum/anchor";
import { Simulation, SimulatedUser } from "./utils/simulation";
import { AddUserArgs, LeaveArgs, TransferTokenAccounts, TransferTokenArgs } from "./anchor_api_wrap/idl/program_type";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "@project-serum/anchor";
import { MonitorBalances } from "./utils/monitor_balance";
import { PublicKey } from "@solana/web3.js";

const user_requests_new_match = async (
    simulation: Simulation,
    user: SimulatedUser
) => {
    const balance_monitor = new MonitorBalances(provider, simulation.mint);
    const user_temp_token_address = anchor.web3.Keypair.generate();
    await balance_monitor.add_keypairs({
        pk: user_temp_token_address,
        name: "user_temp_token_address",
        is_mint_token_acc: true
    }, {
        pk: user.user_token_account,
        name: "user_token_account",
        is_mint_token_acc: true
    }, {
        pk: user.user.publicKey,
        name: "user account",
        is_mint_token_acc: false
    }, {
        // @ts-ignore
        pk: provider.wallet.payer,
        name: "provider.wallet.payer",
        is_mint_token_acc: false
    });

    const add_user_accounts: AddUserArgs = {
        accounts: {
            mint: simulation.mint.mint.publicKey,
            userAccount: user.user.publicKey,
            fromUserTokenAccount: user.user_token_account,
            toTempUserTokenAccount: user_temp_token_address.publicKey,
            matchAuthority: simulation.match.match_keypair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        // @ts-ignore
        signers: [ user.user.payer, provider.wallet.payer, user_temp_token_address ]
    };

    await program.rpc.addUser(deposit_amount, add_user_accounts);
    await balance_monitor.update_balances("after addUser");

    const [ pda, nonce ] = await anchor.web3.PublicKey.findProgramAddress(
        [simulation.match.match_keypair.publicKey.toBuffer(), user.user.publicKey.toBuffer()],
        program.programId
    );

    const transferArgs: TransferTokenArgs = {
        accounts: {
            fromTokenAccount: user_temp_token_address.publicKey,
            toTokenAccount: user.user_token_account,
            matchAuthority: simulation.match.match_keypair.publicKey,
            userAccount: user.user.publicKey,
            programSigner: pda,
            tokenProgram: TOKEN_PROGRAM_ID,
            mint: simulation.mint.mint.publicKey,
        }
    };
    await program.rpc.transferToken(new BN(250), new BN(nonce), transferArgs);
    await balance_monitor.update_balances("after transferToken");

    const leaveArgs: LeaveArgs = {
        accounts: {
            matchAuthority: simulation.match.match_keypair.publicKey,
            // @ts-ignore
            lamportRecipient: provider.wallet.payer.publicKey,
            fromTempTokenAccount: user_temp_token_address.publicKey,
            toUserTokenAccount: user.user_token_account,
            userAccount: user.user.publicKey,
            programSigner: pda,
            tokenProgram: TOKEN_PROGRAM_ID
        }
    };
    await program.rpc.leave(new BN(nonce), leaveArgs);
    await balance_monitor.log_all_changes("leave");
};


const do_stuff = async () => {
    const simulation = await Simulation.init_simulation();
    // const owned_token_accs = await provider.connection.getTokenAccountsByOwner(new PublicKey("5XV5C37DwqzZ9Gz6EhajXoUSVzsV1EfJvec1ygM2BESH"), { mint: new PublicKey("2o4wvUNpwLq3k1uLF1Xibn5esYCg2wG5rXSu9WJLK7mA")})
    // console.log(owned_token_accs);
    // await simulation.mint.make_token_account_for_user("5XV5C37DwqzZ9Gz6EhajXoUSVzsV1EfJvec1ygM2BESH", 5000);
    // // await simulation.mint.mint.mintTo(
    // //     new PublicKey("5XV5C37DwqzZ9Gz6EhajXoUSVzsV1EfJvec1ygM2BESH"),
    // //     simulation.mint.mint.payer,
    // //     [simulation.mint.mintAuthority],
    // //     5000
    // // );
    const user_requesting_match = await simulation.get_simulated_user(true);
    await user_requests_new_match(
        simulation,
        user_requesting_match
    );
};

export const do_test = async (new_provider: anchor.Provider) => {
    c.remake_all_vals = true;
    c.provider = new_provider;
    await do_stuff();
};


if (require.main === module) {
    promise_then_catch(do_stuff);
}



