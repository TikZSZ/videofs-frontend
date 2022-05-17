import { PrivateKey, PublicKey } from "@hashgraph/sdk";
import { decodeBase64, encodeBase64, decodeUTF8, encodeUTF8 } from "tweetnacl-util"
import s from "libsodium-wrappers"
import { inflate as decompress, deflate as compress } from "pako"
import { Buffer } from "buffer";
const hex = {
  encode:(msg:Uint8Array) => Buffer.from(msg).toString('base64'),
  decode:(msg:string) =>  Buffer.from(msg,'base64')
}

const SIGNATURE_LENGTH = 64
const SESSION_KEY_LENGTH = 48
const NONCE_LENGTH = 24

export class X25519PrivateKey {
  constructor(private keyPair: s.KeyPair) { }

  static fromEdd25519PrivateKey(Edd25519PrivateKey: string) {
    return this.fromBytes(hex.decode(Edd25519PrivateKey))
  }

  static fromString(str: string, encoding: 'base64' | 'hex' = 'base64') {
    switch (encoding) {
      case 'base64':
        return this.fromBytes(decodeBase64(str))
      case 'hex':
        return this.fromBytes(hex.decode(str))
    }
  }

  static fromBytes(bytes: Uint8Array) {
    if (bytes.length === 32) {
      return new this(s.crypto_box_seed_keypair(bytes))
    } else if (bytes.length === 48) {
      return new this(s.crypto_box_seed_keypair(bytes.subarray(16)))
    } else if (bytes.length > 32) {
      return new this(s.crypto_box_seed_keypair(bytes.subarray(0, 32)))
    } else {
      throw new Error('invalid secretKey size for X25519 Key')
    }
  }

  static fromHederaPrivateKey(HederaPrivateKey: PrivateKey) {
    return this.fromBytes(hex.decode(HederaPrivateKey.toString()).subarray(16))
  }

  static generate() {
    return new this(s.crypto_box_keypair())
  }

  // base64
  toString() {
    return encodeBase64(this.keyPair.privateKey)
  }

  toBytes() {
    return this.keyPair.privateKey.slice()
  }

  get publicKey() {
    return new X25519PublicKey(this.keyPair.publicKey)
  }

  encrypt(msg: Uint8Array, nonce:Uint8Array,theirX25519PublicKey: Uint8Array) {
    return s.crypto_box_easy(msg,nonce, theirX25519PublicKey, this.keyPair.privateKey)
  }

  decrypt(msg: Uint8Array, nonce:Uint8Array,theirX25519PublicKey: Uint8Array) {
    return s.crypto_box_open_easy(msg,nonce, theirX25519PublicKey, this.keyPair.privateKey)
  }
}

export class X25519PublicKey {
  constructor(private keyData: Uint8Array) { }

  static fromString(text: string) {
    return new this(decodeBase64(text))
  }

  // base64
  toString() {
    return encodeBase64(this.keyData)
  }

  toBytes() {
    return this.keyData.slice()
  }
}

function generateSessionKey() {
  return s.crypto_secretbox_keygen()
}

function sign(msg: Uint8Array, privateKey: Uint8Array) {
  return s.crypto_sign_detached(msg, privateKey)
}

function getMsgWithSig(msg: Uint8Array, privateKey: PrivateKey | Uint8Array) {
  let UInt8MsgSignature: Uint8Array
  if (privateKey instanceof PrivateKey) {
    UInt8MsgSignature = privateKey.sign(msg)
  } else {
    UInt8MsgSignature = sign(msg, privateKey)
  }
  const UIntMsgWithHash = new Uint8Array(SIGNATURE_LENGTH + msg.length)
  UIntMsgWithHash.set(UInt8MsgSignature)
  UIntMsgWithHash.set(msg, SIGNATURE_LENGTH)
  return UIntMsgWithHash
}

function verify(msg: Uint8Array, signature: Uint8Array, publicKey: Uint8Array) {
  return s.crypto_sign_verify_detached(signature, msg, publicKey)
}

function send(encryptedMessage: Uint8Array, encryptedSessionKey: Uint8Array,nonce:Uint8Array) {
  const UInt8EncryptedBody = new Uint8Array(SESSION_KEY_LENGTH + NONCE_LENGTH +encryptedMessage.length)
  UInt8EncryptedBody.set(encryptedSessionKey)
  UInt8EncryptedBody.set(nonce, SESSION_KEY_LENGTH)
  UInt8EncryptedBody.set(encryptedMessage, SESSION_KEY_LENGTH+NONCE_LENGTH)
  return encodeBase64(UInt8EncryptedBody)
}

function unpack(arr: Uint8Array, ...lengths: number[]): Uint8Array[] {
  const subArrays: Uint8Array[] = []
  let sum = 0
  for (let i = 0; i < lengths.length+1; i++) {
    if(lengths[i]){
      subArrays.push(arr.subarray(sum,lengths[i]+sum))
      sum += lengths[i]
    }else if(!lengths[i]){
      subArrays.push(arr.subarray(sum))
    }
  }
  return subArrays
}

function encryptMessageSymWithNonce(message: Uint8Array|string){
  const sessionKey = generateSessionKey()
  const sessionNonce = s.randombytes_buf(24)
  const encryptedMessage = s.crypto_secretbox_easy(message, sessionNonce, sessionKey)
  const encryptedMessageWithNonce = new Uint8Array(NONCE_LENGTH+encryptedMessage.length)
  encryptedMessageWithNonce.set(sessionNonce)
  encryptedMessageWithNonce.set(encryptedMessage,NONCE_LENGTH)
  return {encryptedMessageWithNonce,sessionKey}
}

type Crypto = {
  msg: string,
  X25519PrivateKey: X25519PrivateKey,
  theirX25519PublicKey: X25519PublicKey,
}

export function encrypt({ X25519PrivateKey, msg, theirX25519PublicKey, signatureKey }: Crypto & { signatureKey: PrivateKey | Uint8Array }) {
  const UInt8Msg = decodeUTF8(msg)
  const msgWithSig = getMsgWithSig(UInt8Msg, signatureKey)
  const compressed = compress(msgWithSig)
  const {encryptedMessageWithNonce,sessionKey} = encryptMessageSymWithNonce(compressed)
  const nonce = s.randombytes_buf(24)
  const encryptedSessionKey = X25519PrivateKey.encrypt(sessionKey, nonce,theirX25519PublicKey.toBytes())
  return send(encryptedMessageWithNonce, encryptedSessionKey,nonce)
}

export function decrypt({ X25519PrivateKey, msg, theirX25519PublicKey, signatureKey }: Crypto & { signatureKey: PublicKey | Uint8Array }) {
  const encryptedBody = decodeBase64(msg)
  const [encryptedSessionKey, nonce, encryptedMessageWithNonce] = unpack(encryptedBody, SESSION_KEY_LENGTH,NONCE_LENGTH)  
  const [sessionNonce,encryptedMessage] = unpack(encryptedMessageWithNonce,NONCE_LENGTH)
  const decryptedSessionKey = X25519PrivateKey.decrypt(encryptedSessionKey,nonce, theirX25519PublicKey.toBytes())
  if (!decryptedSessionKey) throw new Error('cannot decrypt session key')
  const UIntMsgWithSig = s.crypto_secretbox_open_easy(encryptedMessage, sessionNonce, decryptedSessionKey)
  if (!UIntMsgWithSig) throw new Error('cannot decrypt message')
  const decompressed = decompress(UIntMsgWithSig)
  const [UInt8Signature, UInt8Msg] = unpack(decompressed, SIGNATURE_LENGTH)
  let isVerified:boolean = false
  try{
    isVerified =verify(UInt8Msg, UInt8Signature, signatureKey instanceof PublicKey ? signatureKey.toBytes() : signatureKey)
  }catch(err){
    isVerified = false
  }
  return encodeUTF8(UInt8Msg)
}

let pkg = {
  X25519PrivateKey,
  X25519PublicKey,
  decodeBase64, encodeUTF8,
  decodeUTF8, encrypt, decrypt,
  get ready() {
    return s.ready
  }
}

export default pkg

export {pkg}
