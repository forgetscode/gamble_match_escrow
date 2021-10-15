import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Provider } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import { deserialize_keypair, serialize_keypair } from "../utils/serialization";
import { CachedKeypair } from "./cached_keypair";

let instance: CachedMint;

export class CachedMint {
    mint: Token;
    payer: CachedKeypair;
    mintAuthority: CachedKeypair;

    constructor(
        mint: Token,
        payer: CachedKeypair,
        mintAuthority: CachedKeypair
    ) {
        this.mint = mint;
        this.payer = payer;
        this.mintAuthority = mintAuthority;
    }

    static getOrCreateMint = async (provider: Provider, path: string = "./data_cache/mint_idl.json", make_new = false) => {
        if (instance != null) {
            return instance;
        } else if (make_new || !fs.existsSync(path)) {
            const new_mint = await CachedMint.newMint(provider);
            new_mint.saveMint(path);
            instance = new_mint;
            return new_mint;
        }
        const new_mint = CachedMint.loadMint(path, provider);
        instance = new_mint;
        return new_mint;
    };

    static newMint = async (provider: Provider): Promise<CachedMint> => {
        // const payer = anchor.web3.Keypair.generate();
        // @ts-ignore
        // const mintAuthority = provider.wallet.payer;
        const mint = await Token.createMint(
            provider.connection,
            // @ts-ignore
            provider.wallet.payer,
            provider.wallet.publicKey,
            null,
            0,
            TOKEN_PROGRAM_ID
        );
        return new CachedMint(
            mint,
            CachedKeypair.fromSecretKey(provider.wallet.payer.secretKey),
            CachedKeypair.fromSecretKey(provider.wallet.payer.secretKey)
        );
    };

    static loadMint = (path: string, provider: Provider) => {
        if (!fs.existsSync(path)) {
            throw new Error(`tried to load a mint at path ${ path } but it doesn't exist!`);
        }
        const data = JSON.parse(fs.readFileSync(path, { encoding: "utf-8" }));
        const payer = deserialize_keypair(data.payer);
        const mintAuthority = deserialize_keypair(data.mintAuthority);
        const mint = new Token(provider.connection, new PublicKey(data.mint), TOKEN_PROGRAM_ID, payer);
        return new CachedMint(
            mint,
            payer,
            mintAuthority
        );
    };

    make_token_account_for_user = async (
        accountPubkey: PublicKey | string,
        amount: number
    ): Promise<PublicKey> => {
        if (this.mint == null) {
            throw new Error("you must initialize the mint first!");
        }
        const pubKey = typeof accountPubkey === "string" ? new PublicKey(accountPubkey) : accountPubkey;
        // const info = await this.mint.getMintInfo();
        const tokenAccountA: PublicKey = await this.mint.createAccount(pubKey);
        await this.mint.mintTo(
            tokenAccountA,
            this.payer,
            [ this.mintAuthority ],
            amount
        );
        return tokenAccountA;
    };

    saveMint = (path: string) => {
        fs.writeFileSync(path, JSON.stringify({
            mint: this.mint.publicKey.toBase58(),
            payer: serialize_keypair(this.payer),
            mintAuthority: serialize_keypair(this.mintAuthority)
        }, null, 4), { encoding: "utf-8" });
    };
}
