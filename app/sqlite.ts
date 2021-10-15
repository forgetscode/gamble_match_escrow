import DB from "sqlite-async";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { CachedKeypair } from "./anchor_api_wrap/cached_keypair";
// export const db = new sqlite3.Database('sqlite.db');

const get_conn = async () =>
    await DB.open("splite.db");

export const create_tables = async (exit = true) => {
    const db = await DB.open("splite.db");
    await db.run('CREATE TABLE match (matchPubKey TEXT, matchPrivKey TEXT)');
    await db.run('CREATE TABLE userMatch (userPubKey TEXT, userTokenPubKey TEXT, matchKey TEXT)');
};

export async function add_match_row(keypair: Keypair | CachedKeypair) {
    const { pubKey, secKey } = {
        pubKey: keypair.publicKey,
        secKey: keypair.secretKey
    };
    const db = await get_conn();
    await db.run(`INSERT INTO match VALUES ('${ pubKey.toString() }', '${ secKey }')`);
}

export const add_user_row = async (match_pk: PublicKey, user_pk: PublicKey, user_temp_token_pk: PublicKey) => {
    const db = await get_conn();
    await db.run(`INSERT INTO match VALUES ('${user_pk.toString()}', '${user_temp_token_pk.toString()}', '${match_pk.toString()}')`);
};
