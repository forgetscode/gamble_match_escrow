import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export class BetterPDA {
    _pdaPubKey: PublicKey;
    _bump: number;
    programId: PublicKey;
    children: PublicKey[] = [];
    constructor(pda_key: PublicKey, bump: number, programId: PublicKey) {
        this._bump = bump;
        this._pdaPubKey = pda_key;
        this.programId = programId;
    }
    static async new_pda(seeds: Uint8Array, programId: PublicKey): Promise<BetterPDA> {
        const [ key, bump ] = await anchor.web3.PublicKey.findProgramAddress(
            [seeds],
            programId
        );
        return new BetterPDA(key, bump, programId);
    }
    get pdaPubKey() {
        return this._pdaPubKey;
    }
    get bump() {
        return this._bump;
    }
    async get_second_order_pda(seeds: string): Promise<PublicKey> {
        const newAuth = await anchor.web3.PublicKey.createWithSeed(
            this.pdaPubKey,
            seeds.slice(0, 32),
            this.programId
        );
        this.children.push(newAuth);
        return newAuth;
    }
}
