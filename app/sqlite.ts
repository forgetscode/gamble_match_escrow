import DB from "sqlite-async";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SavableKeypair } from "./utils/saved_keypair";
// export const db = new sqlite3.Database('sqlite.db');

const get_conn = async () =>
    await DB.open("splite.db");

export const create_tables = async (exit = true) => {
    const db = await DB.open("splite.db");
    await db.run('CREATE TABLE match (matchPubKey TEXT, matchPrivKey TEXT)');
    await db.run('CREATE TABLE userMatch (userPubKey TEXT, userTokenPubKey TEXT, matchKey TEXT)');
    if (exit) {
        const res = await db.all(`
                SELECT 
            name
        FROM 
            sqlite_master 
        WHERE 
            type ='table' AND 
            name NOT LIKE 'sqlite_%';
        `);
        // console.log(res);
        db.close();

        process.exit(0);
    }
};

const is_savable_keypair = (keypair: Keypair | SavableKeypair): keypair is SavableKeypair =>
    (keypair as any)["kp"] != null;

export async function add_match_row(keypair: Keypair | SavableKeypair) {
    const { pubKey, secKey } = {
        pubKey: keypair.publicKey,
        secKey: keypair.secretKey
    };
    const db = await get_conn();
    await db.run(`INSERT INTO match VALUES ('${ pubKey.toString() }', '${ secKey }')`);
    // const res = await db.all(`select * from match`);
    // console.log(res);
}

export const add_user_row = async (match_pk: PublicKey, user_pk: PublicKey, user_temp_token_pk: PublicKey) => {
    const db = await get_conn();
    await db.run(`INSERT INTO match VALUES ('${user_pk.toString()}', '${user_temp_token_pk.toString()}', '${match_pk.toString()}')`);
};
