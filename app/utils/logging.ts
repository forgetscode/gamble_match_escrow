import { Provider } from "@project-serum/anchor";
import { get_pub_key, WithPublicKey } from "./anchor_stuff";
import { sol_divisor } from "./constants";


export const log_change_in_balance = async (provider: Provider, withPublicKey: WithPublicKey) => {
    const publicKey = get_pub_key(withPublicKey);
    const balance_before = await provider.connection.getBalance(publicKey) / sol_divisor;
    console.log(`starting balance: ${ balance_before }`);
    return async () => {
        const balance_after = await provider.connection.getBalance(publicKey) / sol_divisor;
        console.log(`ending balance: $SOL ${ balance_after }, change: ${ balance_before - balance_after }`);
    };
};
