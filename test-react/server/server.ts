import express from "express";
import { AddUserArgs } from "../../app/anchor_api_wrap/idl/program_type";
import * as anchor from "@project-serum/anchor";
import { c, get_c } from "../../app/setup_const";
import { make_mint } from "../../app/utils/simulation";
import { CachedMint } from "../../app/anchor_api_wrap/cached_mint";
import { PublicKey } from "@solana/web3.js";
import { get_user_token_accs } from "../../app/utils/get_user_token_accs";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
const cors = require('cors');
import idl_json from "../../target/idl/unlucky.json";
import { get_program_id_from_anchor } from "../../app/anchor_api_wrap/idl";
const { provider, program } = get_c();

const app = express();
app.use(cors());
app.use(express.json());


let mint: CachedMint | null = null;
const load_mint = async (): Promise<CachedMint> => {
    try {
        if (mint === null) {
            mint = await make_mint(c.provider);
        }
        return mint;
    } catch (e) {
        console.log(e);
        throw e;
    }
};

// const load_idl = () => {
//
// }

app.get("/config", async (req, res) => {
    const mint = await load_mint();
    res.json({
        idl: idl_json,
        program_id: get_program_id_from_anchor(),
        mint: mint.mint.publicKey.toBase58()
    });
});

app.get('/get-match', async (req, res) => {
    // const user_pub_key = new PublicKey(req.body.publicKey);
    const match_key = anchor.web3.Keypair.generate();
    res.json({
        match_key: match_key.publicKey.toBase58()
    });
    // const mint = await load_mint();
    // const user_token_account = await get_user_token_accs(mint.mint.publicKey, user_pub_key);
    // const user_temp_token_address = await mint.make_token_account_for_user(user_pub_key, 0);
    // const match_authority = anchor.web3.Keypair.generate();
    // res.json({
    //     user_token_account: user_token_account.pubkey.toString(),
    //     user_temp_token_address: user_temp_token_address.toString()
    // });
    // const add_user_accounts: AddUserArgs = {
    //     accounts: {
    //         initializer: provider.wallet.publicKey,
    //         mint: mint.mint.publicKey,
    //         userAccount: user_pub_key,
    //         fromUserTokenAccount: user_token_account.pubkey,
    //         toTempUserTokenAccount: user_temp_token_address,
    //         matchAuthority: match_authority.publicKey,
    //         systemProgram: anchor.web3.SystemProgram.programId,
    //         tokenProgram: TOKEN_PROGRAM_ID,
    //         rent: anchor.web3.SYSVAR_RENT_PUBKEY
    //     },
    //     signers: [ user.user.payer, provider.wallet.payer, user_temp_token_address ]
    // };
});

const port = 5050;
app.listen(port, "localhost", () => {
    console.log(`started on ${port}`);
});


