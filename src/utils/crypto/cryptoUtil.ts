import { decodeUTF8 } from "tweetnacl-util";
import { X25519PrivateKey, encrypt as X25519Encrypt, X25519PublicKey } from "@/utils/crypto/pkg";
import { PublicKey, PrivateKey } from "@hashgraph/sdk";
import type { MessagesResponse } from "@tikz/hedera-mirror-node-ts"
import { decodeBase64, encodeUTF8 } from "tweetnacl-util";
import { pkg } from "@/utils/crypto/pkg";
import {Buffer} from "buffer"
export { inflate as decompress, deflate as compress } from "pako"
//@ts-ignore
import stringify from "json-stringify-deterministic";

const CHUNK_SIZE = 1024;
const CHUNK_BYTES = 2

export function getChunks(message: string | Uint8Array) {
  if (typeof message === 'string') {
    const textDecoder = new TextEncoder()
    return Math.floor((textDecoder.encode(message).length + (CHUNK_SIZE - 1)) / CHUNK_SIZE);
  }
  return Math.floor((message.length + (CHUNK_SIZE - 1)) / CHUNK_SIZE);
}



export function addChunksMetaToMessage(message: Uint8Array) {
  const messageUint8 = new Uint8Array(CHUNK_BYTES + message.length)
  messageUint8.set(message, 2)
  const chunks = getChunks(messageUint8)
  messageUint8.set(decodeUTF8(chunks.toString()).slice(0, 2))
  return { messageWithChunks: messageUint8, chunks }
};

export function encryptMessageWithChunks(message: string, privateKey: string,thier_x25518_key:string) {
  const { encryptedMessage,x25519PubK } = encrypt(message, privateKey,thier_x25518_key)
  return addChunksMetaToMessage(Buffer.from(encryptedMessage))
}



function parseJSONMessage(msg: string): object {
  try {
    return JSON.parse(msg)
  } catch (err) {
    return {
      error: "Couldn't parse message"
    }
  }
}



export function assembleMessageChunks(
  msgs: { message: string }[]
) {
  let assembledMessages: string[] = [];
  for (let i = 0; i < msgs.length; i++) {
    let decryptedMessage: any | null = null;
    const base64DecodedMsg = decodeBase64(msgs[i].message);
    const parsedChunks = parseInt(encodeUTF8(base64DecodedMsg.subarray(0, 2)))
    console.log();
    
    const chunks = isNaN(parsedChunks) ? null : parsedChunks;
    if (chunks === null) continue;
    else if (chunks === 1) {
      assembledMessages.push(encodeUTF8(base64DecodedMsg.subarray(2)))
    }
    else if (chunks + i > msgs.length) {
      console.error("Incomplete message chunks missing")
      break
    }
    else {
      let completeMsg = "";
      for (let j = 0; j < chunks; j++) {
        if (j === 0) {
          completeMsg += encodeUTF8(
            decodeBase64(msgs[i + j].message).subarray(2)
          );
        } else {
          completeMsg += encodeUTF8(decodeBase64(msgs[i + j].message));
        }
      }
      i += chunks - 1;
      assembledMessages.push(completeMsg)
    }
  }
  return { assembledMessages };
};

export function parseConsenusMessages<T extends object = any>(consensusMsgs: MessagesResponse["messages"]) {
  if(consensusMsgs.length < 1) return []
  const { assembledMessages } = assembleMessageChunks(consensusMsgs)
  const parsedMessages: T[] = []
  for (const assembledMessage of assembledMessages) {
    parsedMessages.push(parseJSONMessage(assembledMessage) as T)
  }
  return parsedMessages
}


function decrypt (
  message: string,
  privateKey: string,
  their_ed25519_public_key:string,
  thier_x25518_key:string
)  {
  const { X25519PrivateKey, X25519PublicKey, decrypt: drcpt } = pkg;
  let decryptedMessage: string | null;
  try {
    const msg = drcpt({
      msg: message,
      X25519PrivateKey: X25519PrivateKey.fromEdd25519PrivateKey(privateKey!),
      signatureKey: PublicKey.fromString(their_ed25519_public_key),
      theirX25519PublicKey: X25519PublicKey.fromString(thier_x25518_key),
    });
    decryptedMessage = msg
  } catch (err) {
    decryptedMessage = null;
  }
  return decryptedMessage;
};

function encrypt(msgToEncrypt: string,privateKey: string,x25519_public_key_key:string){
  const x25519PVK = X25519PrivateKey.fromEdd25519PrivateKey(privateKey)
  const theirX25519PUBk = X25519PublicKey.fromString(x25519_public_key_key)
  const encryptedMessage = X25519Encrypt({
    X25519PrivateKey: x25519PVK,
    msg: msgToEncrypt,
    signatureKey: PrivateKey.fromString(privateKey),
    theirX25519PublicKey: theirX25519PUBk
  })
  return { encryptedMessage, x25519PubK: x25519PVK.publicKey.toString() }
}

export const decryptMessages = (
  consensusMsgs: MessagesResponse["messages"],
  privateKey: string
) => {
  let decryptedMessages: any[] = [];
  for (let i = 0; i < consensusMsgs.length; i++) {
    let decryptedMessage: any | null = null;
    const base64DecodedMsg = decodeBase64(consensusMsgs[i].message);
    const parsedChunks = parseInt(encodeUTF8(base64DecodedMsg.subarray(0, 2)))
    const chunks = isNaN(parsedChunks) ? null : parsedChunks;
    if (chunks === null) continue;
    else if (chunks === 1) {
      const { message, x25519_public_key, ed25519_public_key } = JSON.parse(
        encodeUTF8(base64DecodedMsg.subarray(2))
      );
      const msg = decrypt(message, privateKey, ed25519_public_key, x25519_public_key);
      if (!msg) {
        decryptedMessages.push({ subject: 'Error: Cannot Decrypt Invalid Keys' })
        continue
      };
      decryptedMessages.push({ ...parseJSONMessage(msg), x25519_public_key })
    }
    else {
      if (chunks + i > consensusMsgs.length) break;
      let completeMsg = "";
      for (let j = 0; j < chunks; j++) {
        if (j === 0) {
          completeMsg += encodeUTF8(
            decodeBase64(consensusMsgs[i + j].message).subarray(2)
          );
        } else {
          completeMsg += encodeUTF8(decodeBase64(consensusMsgs[i + j].message));
        }
      }
      const { message, x25519_public_key, ed25519_public_key } = JSON.parse(completeMsg);
      const msg = decrypt(message, privateKey, ed25519_public_key, x25519_public_key);
      i += chunks - 1;
      if (!msg) {
        decryptedMessages.push({ subject: 'Error: Cannot Decrypt Invalid Keys' })
        continue
      };
      decryptedMessages.push({ ...parseJSONMessage(msg), x25519_public_key })
    }
  }
  return decryptedMessages;
};