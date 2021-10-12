
import * as fs from "fs";
import { deserialize_keypair, serialize_keypair } from "./serialization";
import { Keypair } from "@solana/web3.js";


export class SavableKeypair {
    keypair: Keypair;
    constructor() {
        this.keypair = Keypair.generate();
    }
    get serialized_secret() {
        return serialize_keypair(this);
    }
    save = (path: string) => {
        fs.writeFileSync(path, this.serialized_secret, { encoding: "utf-8" });
    }
    static load = (path: string) => {
        return deserialize_keypair(fs.readFileSync(path, { encoding: "utf-8" }));
    }
    get publicKey() {
        return this.keypair.publicKey;
    }
    get secretKey() {
        return this.keypair.secretKey;
    }
    static fromSecretKey(secret_key: Uint8Array) {
        const savable = new SavableKeypair();
        savable.keypair = Keypair.fromSecretKey(secret_key);
        return savable;
    }
    static getOrCreateKp(path: string, make_new = false) {
        if (make_new || !fs.existsSync(path)) {
            const new_kp = SavableKeypair.generate();
            new_kp.save(path);
            return new_kp;
        }
        return SavableKeypair.load(path);
    }
    static generate() {
        const new_kp = Keypair.generate();
        return SavableKeypair.fromSecretKey(new_kp.secretKey);
    }
    get kp() {
        return this.keypair;
    }
}

