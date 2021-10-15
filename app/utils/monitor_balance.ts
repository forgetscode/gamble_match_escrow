import { Provider } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";

export class MonitorBalances {
    keypair_balances: {
        [key: string]: {
            balances: {
                balance: number,
                update_name: string
            }[],
            name: string,
            pk: string
        }
    } = {};
    provider: Provider;

    constructor(provider: Provider) {
        this.provider = provider;
    }

    add_keypairs = async (kp_names: [ Keypair, string ][]) => {
        if (!Array.isArray(kp_names)) {
            throw Error("add_keypairs needs an array!");
        }
        for (const item of kp_names) {
            let kp, name;
            kp = item[0];
            name = item[1];
            await this.add_keypair(kp, name);
        }
    };
    add_keypair = async (kp: Keypair, name: string) => {
        const kp_key = kp.publicKey.toString();
        const balance = await this.provider.connection.getBalance(kp.publicKey);
        if (!this.keypair_balances.hasOwnProperty(kp_key)) {
            this.keypair_balances[kp_key] = {
                balances: [],
                name: "",
                pk: ""
            };
        }
        this.keypair_balances[kp_key] = {
            balances: [
                ...this.keypair_balances[kp_key].balances,
                {
                    balance,
                    update_name: "init"
                }
            ],
            name: name,
            pk: kp_key
        };
    };
    get_balance = async (pk: PublicKey, update_name: string) => {
        const new_balance = await this.provider.connection.getBalance(pk);
        return {
            [pk.toString()]: {
                balance: new_balance,
                update_name
            }
        };
    };
    get_new_balance = async (update_name: string) => {
        const new_balance_promises = [];
        for (const pk of Object.keys(this.keypair_balances)) {
            const pub_key = new PublicKey(this.keypair_balances[pk].pk);
            await this.get_balance(pub_key, update_name);
            new_balance_promises.push(this.get_balance(pub_key, update_name));
        }
        return Object.assign({}, ...await Promise.all(new_balance_promises));
    };
    update_balances = async (update_name: string) => {
        const new_balances = await this.get_new_balance(update_name);
        for (const key of Object.keys(this.keypair_balances)) {
            this.keypair_balances[key].balances = [
                new_balances[key],
                ...this.keypair_balances[key].balances
            ];
        }
    };
    log_all_changes = async () => {
        const new_balances = await this.get_new_balance("final");
        console.log(`\n######################################\n`);
        for (const [ key, account ] of Object.entries(this.keypair_balances)) {
            let prev = null;
            let updates = [];
            for (const balance of [
                new_balances[key],
                ...account.balances
            ].reverse()) {
                if (prev !== null) {
                    if (prev.balance !== balance.balance) {
                        updates.push(`Change in balance after ${ balance.update_name } :: ${ prev.balance } -> ${ balance.balance }`);
                    }
                }
                prev = balance;
            }
            console.log(`Balance changes for ${ account.name } <${ key }>:\n${ updates.join("\n") }`);
            console.log(`\n######################################\n`);
        }
    };
}
