import * as anchor from "@project-serum/anchor";
import * as fs from "fs";
const appRoot = require('app-root-path').path;

export const get_provider_keypair = () => {
    const toml = fs.readFileSync(`${appRoot}/Anchor.toml`, { encoding: "utf8" });
    for (const line of toml.split("\n")) {
        if (line.startsWith("wallet")) {
            const splitted = line.split("=");
            const trimmed = splitted[splitted.length - 1].trim();
            const replaced = trimmed.replace(/"/g, "").replace("~", "");
            return `${process.env.HOME}${replaced}`;
        }
    }
};

const get_address = (idl: any, address?: string, load_toml?: boolean) => {
    if (address) {
        return address;
    } else if (load_toml) {
        const toml = fs.readFileSync(`${appRoot}/Anchor.toml`, { encoding: "utf8" });
        for (const line of toml.split("\n")) {
            if (line.startsWith("gamble_match_escrow")) {
                const splitted = line.split("=");
                const trimmed = splitted[splitted.length - 1].trim();
                return trimmed.replace(/"/g, "");
            }
        }
    } else if (!idl.hasOwnProperty("metadata")) {
        throw new Error("Idl has no metadata property!");
    } else if (!idl.metadata.hasOwnProperty("address")) {
        throw new Error("Idl metadata has no address property!");
    }
    return idl.metadata.address;
};

interface LoadProgramOpts {
    address?: string
    load_toml?: boolean
}
export const load_program_from_idl = ({ address, load_toml }: LoadProgramOpts): anchor.Program => {
    if (address && load_toml) {
        throw Error("load_program_from_idl only accepts one of address or load_toml as options!");
    }
    const target_dir = `${appRoot}/target/idl`;
    const fns = fs.readdirSync(target_dir).filter(x => x.endsWith(".json"));
    if (fns.length < 1) {
        throw new Error("Build your bpf program first fam");
    } else if (fns.length > 1) {
        console.warn(`expected only one idl in target/idl but got ${fns.length}`);
    }
    const idl = JSON.parse(fs.readFileSync(`${target_dir}/${fns[0]}`, 'utf8'));
    const resolved_address = get_address(idl, address, load_toml)
    console.log(`Loading program: ${resolved_address}`);
    const programId = new anchor.web3.PublicKey(resolved_address);
    return new anchor.Program(idl, programId);
};