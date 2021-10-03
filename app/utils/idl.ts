import * as anchor from "@project-serum/anchor";
import * as fs from "fs";
const appRoot = require('app-root-path').path;

const get_address = (idl: any, address?: string) => {
    if (address) {
        return address;
    } else if (!idl.hasOwnProperty("metadata")) {
        throw new Error("Idl has no metadata property!");
    } else if (!idl.metadata.hasOwnProperty("address")) {
        throw new Error("Idl metadata has no address property!");
    }
    return idl.metadata.address;
};

export const load_program_from_idl = (address?: string): anchor.Program => {
    const target_dir = `${appRoot}/target/idl`;
    const fns = fs.readdirSync(target_dir).filter(x => x.endsWith(".json"));
    if (fns.length < 1) {
        throw new Error("Build your bpf program first fam");
    } else if (fns.length > 1) {
        console.warn(`expected only one idl in target/idl but got ${fns.length}`);
    }
    const idl = JSON.parse(fs.readFileSync(`${target_dir}/${fns[0]}`, 'utf8'));
    const resolved_address = get_address(idl, address)

    const programId = new anchor.web3.PublicKey(resolved_address);
    return new anchor.Program(idl, programId);
};