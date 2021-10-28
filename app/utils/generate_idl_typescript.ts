import * as fs from "fs";

const app_root = require('app-root-path').path;

const is_num = (type: string) =>
    /^[uif](8|16|32|64|128)$/g.test(type);


type ArgTypeBase = "BN" | "string";
type ArgType = ArgTypeBase | `${ArgTypeBase} | null`;

const get_resolved_type_base = (type: string): ArgTypeBase => {
    if (is_num(type)) {
        return "BN";
    } else {
        return "string";
    }
};

const get_resolved_type = (type: TypeType): ArgType => {
    if (typeof type === "string") {
        return get_resolved_type_base(type);
    } else if (typeof type === "object" && !Array.isArray(type) && type.hasOwnProperty("option")) {
        return `${get_resolved_type_base(type.option)} | null`;
    }
    throw new Error("got bad type for idl!");
};

type TypeType = string | { option: string };

const generate_args = (args: { name: string, type: TypeType }[]) =>
    args.reduce((obj, arg) => {
        const type = get_resolved_type(arg.type);
        return [ ...obj, `${arg.name}: ${type}`];
    }, [] as string[]);

const generate_accounts = (accounts: { isSigner: boolean; name: string; isMut: boolean }[], capitalized_name: string) => {
    const account_fields = accounts.reduce((obj, account) => ([
        ...obj,
        `    ${account.name}: PublicKey;`
    ]), [] as string[]);
    // const are_signers = accounts.some(x => x.isSigner);
    return `
export type ${capitalized_name}Accounts = {
${account_fields.join("\n")}
};
export type ${capitalized_name}Args = {
    accounts: ${capitalized_name}Accounts,
    signers?: Signers,
    remaining_accounts?: RemainingAccounts
};`.trim();
};

const find_idl = () => {
    const root = `${app_root}/target/idl`;
    const fns = fs.readdirSync(root);
    if (fns.length !== 1) {
        throw new Error(`got too many idl files in ${root}!`);
    }
    return JSON.parse(fs.readFileSync(`${root}/${fns[0]}`, { encoding: "utf-8" }));
};

const mk_if_not_exists = (path: string) => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
};

const write_type_file = (type_file_str: string) => {
    const anchor_api_wrap = `${app_root}/app/anchor_api_wrap`;
    mk_if_not_exists(anchor_api_wrap);
    const idl_folder = `${anchor_api_wrap}/idl`;
    mk_if_not_exists(idl_folder);
    fs.writeFileSync(`${idl_folder}/program_type.ts`, type_file_str, { encoding: "utf-8" });
};

const generate_idl_typescript = () => {
    const account_args_types: string[] = [];
    const instruction_types: string[] = [];
    const idl = find_idl();
    for (const instruction of idl.instructions) {
        const resolved_args = generate_args(instruction.args);
        const capitalized_name = `${instruction.name[0].toUpperCase()}${instruction.name.slice(1, instruction.name.length)}`;
        const resolved_accounts = generate_accounts(instruction.accounts, capitalized_name);
        account_args_types.push(resolved_accounts);
        instruction_types.push(`    ${instruction.name}: (${resolved_args.join(", ")}, named_args: ${capitalized_name}Args) => Promise<string>;`);
    }
    const type_file = `
export type Signers = Keypair[];
export type RemainingAccount = { pubkey: PublicKey, isMut?: boolean, isSigner?: boolean };
export type RemainingAccounts = RemainingAccount[];
${account_args_types.join("\n")}
export interface RpcNamespace {
${instruction_types.join("\n")}
}`.trim();
    const override_rpc_type_file = `
import { BN, Coder } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";

${type_file}
export declare class Program implements anchor.Program {
    // @ts-ignore
    readonly rpc: RpcNamespace;
    programId: PublicKey;
    coder: Coder;
}`.trim();
    write_type_file(override_rpc_type_file);
};

generate_idl_typescript();
