import { PrivateKey, PublicKey } from "@hashgraph/sdk";
import axios from "axios";
//@ts-ignore
import stringify from "json-stringify-deterministic"
import { Buffer } from "buffer";

export type Network = "mainnet" | "testnet";

export interface SignedPayload<T extends object | string = any> {
  serverSignature: string;
  originalPayload: {
    url: string;
    data: T;
  };
}

interface Payload {
  url: string,
  data: object | string
}

export class ServerUtil<T extends object | string> {
  private static _instance: ServerUtil<object | string>;
  private publicKey: PublicKey;
  private privateKey: PrivateKey;
  public mirrorNodeURL: string;

  /**
   * @param mirrorNodeURL Mirror Node url to use for verification purpose. Including /api/v1 etc so in order to keep it as vendor agnostic as possible and allow it to stay updated
   * @param privateKey private key used for signing the payload
   * @param domainUrl url used in hashConnect.authenticate method
   */
  constructor(
    public domainUrl: string,
    privateKey: string | PrivateKey,
    mirrorNodeURL: string
  ) {
    if (typeof privateKey === "string") {
      this.privateKey = PrivateKey.fromString(privateKey);
    } else this.privateKey = privateKey;
    this.publicKey = this.privateKey.publicKey;
    this.mirrorNodeURL = mirrorNodeURL;
    ServerUtil._instance = this;
  }

  public static Instance(constructorParams?: {
    domainUrl: string;
    privateKey: string | PrivateKey;
    mirrorNodeURL: string;
  }) {
    if (this._instance) return this._instance;
    if (!constructorParams) throw new Error("Instance not found");
    this._instance = new this(
      constructorParams.domainUrl,
      constructorParams.privateKey,
      constructorParams.mirrorNodeURL
    );
    return this._instance;
  }

  /**
   * @param accountID 
   * @returns publicKey from mirror node for the given accountID
   */
  async validateAccountId(accountID: string) {
    const { data } = await axios.get<MirrorNodeResponse>(
      `${this.mirrorNodeURL}/accounts?account.id=${accountID}`
    );

    if (data.accounts.length < 1) throw new Error("Invalid account ID");

    const filteredAccounts = data.accounts.filter((account) => {
      return account.account === accountID;
    });

    if (filteredAccounts.length < 1) throw new Error("Invalid account ID");

    if (!filteredAccounts[0].key || !filteredAccounts[0].key.key)
      throw new Error("Account publicKey not found");

    return {
      accountId: accountID,
      publicKey: filteredAccounts[0].key,
    };
  }

  /**
   * @param data object or string to be signed
   * @returns payload object and server signature in base64 format
   */
  getPayloadToSign(data: T) {
    const payload = {
      url: this.domainUrl,
      data: data,
    };

    const serverSig = Buffer.from(
      this.privateKey.sign(Buffer.from(this.getPayloadForServerSig(payload)))
    ).toString("base64");
    console.log({ serverSig });

    return {
      payload,
      serverSig,
    };
  }

  private getPayloadForServerSig(payload: Payload) {
    console.log(stringify(payload));
    let payloadForServerSig = this.privateKey.sign(Buffer.from(stringify(payload)))
    return payloadForServerSig
  }

  /**
   * @param userPubKey In format received from mirror node
   * @param signedPayload Signed Object as returned from hashconnect.authenticate method
   * @param userSignature base64 formatted string
   * @returns If user signed the payload
   */
  verifyPayloadSig(
    userPubKey: string,
    signedPayload: SignedPayload<T>,
    userSignature: string
  ) {
    if (!userPubKey || !signedPayload || !userSignature) throw new Error("invalid params")
    console.log(userPubKey,
      signedPayload,
      userSignature
    );

    const isServerSigned = this.publicKey.verify(
      Buffer.from(this.getPayloadForServerSig(signedPayload.originalPayload)),
      Buffer.from(signedPayload.serverSignature, "base64")
    );
    console.log({isServerSigned});
    if (!isServerSigned) throw new Error("Unauthorized payload submitted");
    const isUserSigned = PublicKey.fromString(userPubKey).verify(
      Buffer.from(stringify(signedPayload)),
      Buffer.from(Buffer.from(userSignature, "base64"))
    );
    console.log({isUserSigned,userPubKey});
    return isUserSigned;
  }
}

interface MirrorNodeResponse {
  accounts: Account[];
  links: Links;
}

interface Links {
  next?: any;
}

interface Account {
  account: string;
  alias?: any;
  auto_renew_period: number;
  balance: Balance;
  deleted: boolean;
  expiry_timestamp?: any;
  key: Key;
  max_automatic_token_associations: number;
  memo: string;
  receiver_sig_required: boolean;
}

interface Key {
  _type: "ED25519" | "ECDSA";
  key: string;
}

interface Balance {
  balance: number;
  timestamp: string;
  tokens: any[];
}
