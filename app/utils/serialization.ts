
import { Keypair, PublicKey, Signer } from "@solana/web3.js";
import { CachedKeypair } from "../anchor_api_wrap/cached_keypair";


// export const makeKeypairSerializable = (kp: Keypair) => ({
//     publicKey: kp.publicKey.toBuffer(),
//     secretKey: kp.secretKey
// });

export const serialize_keypair = (kp: Keypair | CachedKeypair) => Buffer.from(kp.secretKey).toString("base64");
export const deserialize_keypair = (base64: string) => CachedKeypair.fromSecretKey(Uint8Array.from(Buffer.from(base64, "base64")));

