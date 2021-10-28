import { CachedMint } from "../anchor_api_wrap/cached_mint";
import { NodeWallet } from "./provider";
import { CachedKeypair } from "../anchor_api_wrap/cached_keypair";
import { Provider } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { Token } from "@solana/spl-token";
import { c } from "../setup_const";
import { BetterPDA } from "../anchor_api_wrap/better_pda";
const app_root = require("app-root-path").path;


const make_token_account = async (mintWrapper: CachedMint, userWallet: NodeWallet, amount = 2000) => {
    return await mintWrapper.make_token_account_for_user(
        userWallet.publicKey,
        amount
    );
};

export const make_mint = async (provider: Provider): Promise<CachedMint> => {
    return await CachedMint.getOrCreateMint(provider, `${app_root}/data_cache/mint_idl.json`, false);
};

export const create_new_match = () => {
    return CachedKeypair.getOrCreateKp(`${app_root}/data_cache/match_key_idl.json`, c.remake_all_vals);
};


export const new_user_wallet = (user_num: number) => {
    const simulatedKeyPair = CachedKeypair.getOrCreateKp(`${app_root}/data_cache/simulated_key_pair_idl_${ user_num }.json`, false);
    return new NodeWallet(simulatedKeyPair.kp);
};

export class SimulatedUser {
    user: NodeWallet;
    user_token_account: PublicKey;
    constructor(
        user: NodeWallet,
        user_token_account: PublicKey
    ) {
        this.user = user;
        this.user_token_account = user_token_account;
    }
    static async init_user(user_num: number, mint: CachedMint): Promise<SimulatedUser> {
        const user = new_user_wallet(user_num);
        const user_token_account = await make_token_account(mint, user);
        return new SimulatedUser(
            user,
            user_token_account
        );
    }
}

export class SimulatedMatch {
    match_keypair: CachedKeypair;
    pda: BetterPDA;
    constructor(
        match_keypair: CachedKeypair,
        pda: BetterPDA
    ) {
        this.match_keypair = match_keypair;
        this.pda = pda;
    }
    static async init_match() {
        const match = create_new_match();
        const match_pda = await BetterPDA.new_pda(match.publicKey, c.program.programId);
        return new SimulatedMatch(
            match,
            match_pda
        );
    }
}

export class Simulation {
    mint: CachedMint;
    user_num: number = 0;
    users: SimulatedUser[] = [];
    match: SimulatedMatch;
    constructor(
        match: SimulatedMatch,
        mint: CachedMint
    ) {
        this.match = match;
        this.mint = mint;
    }
    async get_simulated_user(air_drop_lamports?: boolean): Promise<SimulatedUser> {
        const simulated_user = await SimulatedUser.init_user(this.user_num, this.mint);
        if (air_drop_lamports) {
            await c.provider.connection.confirmTransaction(
                await c.provider.connection.requestAirdrop(simulated_user.user.publicKey, 10000000000),
                'recent'
            );
        }
        console.log((await c.provider.connection.getBalance(simulated_user.user.publicKey)));
        this.user_num++;
        this.users.push(simulated_user);
        return simulated_user;
    }
    get_user_by_num(idx: number) {
        if (idx > this.users.length - 1) {
            throw new Error(`tried to get user at index ${idx} but only ${this.users.length} exist in the simulation!`);
        }
        return this.users[idx];
    }
    static async init_simulation() {
        const match = await SimulatedMatch.init_match();
        const mint = await make_mint(c.provider);
        console.log(mint.mint.publicKey.toBase58());
        return new Simulation(
            match,
            mint
        );
    }
}

