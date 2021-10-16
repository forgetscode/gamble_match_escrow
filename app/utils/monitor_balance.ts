import { Provider } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { CachedMint } from "../anchor_api_wrap/cached_mint";
import { covert_lamports_to_sol } from "./general";

export class MonitorBalances {
    keypair_balances: {
        [key: string]: {
            balances: {
                balance: number,
                update_name: string
            }[],
            name: string,
            pk: string,
            is_mint_token_acc: boolean
        }
    } = {};
    provider: Provider;
    mint?: CachedMint;
    constructor(provider: Provider, mint?: CachedMint) {
        this.provider = provider;
        this.mint = mint;
    }

    add_keypairs = async (...kp_names: { pk: PublicKey | Keypair, name: string, is_mint_token_acc?: boolean }[]) => {
        if (!Array.isArray(kp_names)) {
            throw Error("add_keypairs needs an array!");
        }
        for (const { pk, name, is_mint_token_acc } of kp_names) {
            await this.add_keypair(pk instanceof PublicKey ? pk : pk.publicKey, name, is_mint_token_acc);
        }
    }
    add_keypair = async (pk: PublicKey | Keypair, name: string, is_mint_token_acc: boolean = false) => {
        const pk_key = pk.toString();
        const balance = await this.get_balance_amount(pk instanceof PublicKey ? pk : pk.publicKey, is_mint_token_acc);
        if (!this.keypair_balances.hasOwnProperty(pk_key)) {
            this.keypair_balances[pk_key] = {
                balances: [],
                name: "",
                pk: "",
                is_mint_token_acc
            };
        }
        this.keypair_balances[pk_key] = {
            balances: [
                ...this.keypair_balances[pk_key].balances,
                {
                    balance,
                    update_name: "init"
                }
            ],
            name: name,
            pk: pk_key,
            is_mint_token_acc
        };
    }
    get_balance_amount = async (pub_key: PublicKey, is_mint_token_acc: boolean = false) => {
        if (!is_mint_token_acc) {
            return await this.provider.connection.getBalance(pub_key);
        } else if (this.mint) {
            try {
                return (await this.mint.mint.getAccountInfo(pub_key)).amount.toNumber();
            } catch (e) {
                return 0;
            }
        }
        throw new Error(`tried to get balance for mint token but didn't pass in mint!`);
    }
    get_balance = async (pk: PublicKey, update_name: string, is_mint_token_acc: boolean = false) => {
        const new_balance = await this.get_balance_amount(pk, is_mint_token_acc);
        return {
            [pk.toString()]: {
                balance: new_balance,
                update_name
            }
        };
    }
    get_new_balance = async (update_name: string) => {
        const new_balance_promises = [];
        for (const pk of Object.keys(this.keypair_balances)) {
            const pub_key = new PublicKey(this.keypair_balances[pk].pk);
            new_balance_promises.push(this.get_balance(pub_key, update_name, this.keypair_balances[pk].is_mint_token_acc));
        }
        return Object.assign({}, ...await Promise.all(new_balance_promises));
    }
    update_balances = async (update_name: string) => {
        const new_balances = await this.get_new_balance(update_name);
        for (const key of Object.keys(this.keypair_balances)) {
            this.keypair_balances[key].balances = [
                new_balances[key],
                ...this.keypair_balances[key].balances
            ];
        }
    }
    log_all_changes = async (final_name?: string) => {
        const new_balances = await this.get_new_balance(final_name ? final_name : "final");
        for (const [ key, account ] of Object.entries(this.keypair_balances)) {
            let prev = null;
            let updates = [];
            for (const balance of [
                new_balances[key],
                ...account.balances
            ].reverse()) {
                if (prev !== null) {
                    if (prev.balance !== balance.balance) {
                        const prev_balance = !account.is_mint_token_acc ? covert_lamports_to_sol(prev.balance) : prev.balance;
                        const new_balance = !account.is_mint_token_acc ? covert_lamports_to_sol(balance.balance) : balance.balance;
                        updates.push(`Change in ${!account.is_mint_token_acc ? "$SOL" : "$XYZ"} balance after ${ balance.update_name } :: ${ prev_balance } -> ${ new_balance }, diff: ${new_balance - prev_balance >= 0 ? `+${new_balance - prev_balance}` : new_balance - prev_balance}`);
                    }
                }
                prev = balance;
            }
            if (updates.length > 0) {
                console.log(`\n############### ${ account.name } (${ key }) ####################\n`);
                console.log(`${ updates.join("\n") }`);
            }
        }

        console.log(`\n######################################\n`);
    }
}
