import {Provider, Wallet} from "@project-serum/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
// import {provider} from "../some_test2";
import * as anchor from "@project-serum/anchor";
import { Buffer } from "buffer";
import { BetterPDA } from "../anchor_api_wrap/better_pda";

export type WithPublicKey = PublicKey | Provider | Wallet | Keypair;

const is_public_key = (val: WithPublicKey): val is PublicKey => val.hasOwnProperty("_bn");
const is_provider = (val: WithPublicKey): val is Provider => val.hasOwnProperty("wallet");

export const get_pub_key = (withPublicKey: WithPublicKey): PublicKey => {
    if (is_public_key(withPublicKey)) {
        return withPublicKey;
    } else if (is_provider(withPublicKey)) {
        return withPublicKey.wallet.publicKey;
    }
    return withPublicKey.publicKey;
};

export const account_with_sol = async (amount_sol = 10): Promise<Keypair> => {
    const matchAccount = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(matchAccount.publicKey, 10000000000),
        "confirmed"
    );
    return matchAccount;
};

const new_keypair = (): Keypair =>
    anchor.web3.Keypair.generate();

let provider: Provider = null as unknown as Provider;
export const anchor_util = {
    setProvider(_provider: Provider) {
        provider = _provider;
    },
    new_keypair,
    get_pda: BetterPDA.new_pda
};

