import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export class BetterPDA {
    programId: PublicKey;
    children: PublicKey[] = [];

    constructor(pda_key: PublicKey, bump: number, programId: PublicKey) {
        this._bump = bump;
        this._pdaPubKey = pda_key;
        this.programId = programId;
    }

    _pdaPubKey: PublicKey;

    get pdaPubKey() {
        return this._pdaPubKey;
    }

    _bump: number;

    get bump() {
        return this._bump;
    }

    /**     const match_pda = await BetterPDA.new_pda(matchAccount.publicKey, program.programId);
     */
    static async new_pda(seeds: Uint8Array | PublicKey, programId: PublicKey): Promise<BetterPDA> {
        const _seeds = seeds instanceof PublicKey ? seeds.toBuffer() : seeds;
        const [ key, bump ] = await anchor.web3.PublicKey.findProgramAddress(
            [ _seeds.slice(0, 32) ],
            programId
        );
        return new BetterPDA(key, bump, programId);
    }

    async get_second_order_pda(seeds: string | PublicKey): Promise<PublicKey> {
        const _seeds = seeds instanceof PublicKey ? seeds.toString() : seeds;
        const newAuth = await anchor.web3.PublicKey.createWithSeed(
            this.pdaPubKey,
            _seeds.slice(0, 32),
            this.programId
        );
        this.children.push(newAuth);
        return newAuth;
    }
}
