import fs from "fs";
import { get_provider_keypair, load_program_from_idl } from "./anchor_api_wrap/idl";
import * as anchor from "@project-serum/anchor";
import { NodeWallet } from "./utils/provider";
import { anchor_util } from "./utils/anchor_stuff";
import { Connection } from "@solana/web3.js";

if (!fs.existsSync("./data_cache")) {
    fs.mkdirSync("./data_cache");
}

process.env.ANCHOR_WALLET = get_provider_keypair();
let provider = new anchor.Provider(
    new Connection("http://127.0.0.1:8899", "processed"),
    NodeWallet.local(),
    { commitment: "processed" }
);

anchor.setProvider(provider);

export const deposit_amount = new anchor.BN(500);

const program = load_program_from_idl({ load_toml: true });
anchor_util.setProvider(provider);

// constants
export let c = {
    provider,
    program,
    deposit_amount: new anchor.BN(500),
    remake_all_vals: true
};

export type ConstantType = typeof c;
export const get_c = (): ConstantType => {
   return c;
};

