import { NodeWallet } from "./provider";
import { SolanaAccountInfo } from "../../test-react/app/src/App";
import { c } from "../setup_const";
import { PublicKey, TokenAmount } from "@solana/web3.js";

export const get_user_token_accs = async (mint_pub_key: PublicKey, user_wallet: NodeWallet | PublicKey): Promise<SolanaAccountInfo> => {
    const user_token_accounts = (await c.provider.connection.getTokenAccountsByOwner(
        user_wallet instanceof PublicKey ? user_wallet : user_wallet.publicKey,
        { mint: mint_pub_key }
    )).value;
    const valid_user_token_accounts = user_token_accounts.filter(async user_account => {
        const balance = await c.provider.connection.getTokenAccountBalance(user_account.pubkey, "confirmed");
        const amount = (balance.value as TokenAmount).uiAmount;
        return amount != null && amount > c.deposit_amount.toNumber();
    });
    if (valid_user_token_accounts.length <= 0) {
        throw new Error("no valid accounts!");
    }
    const user_token_account = valid_user_token_accounts[0];
    const bal = await c.provider.connection.getTokenAccountBalance(user_token_account.pubkey);
    // console.log(bal);
    // Account
    // Token.createTransferInstruction()
    return user_token_account;
};
