export interface AuthEntity {
  key: string;
  keyType: string;
  diCid?: string;
}

export interface UserEntity extends AuthEntity {
  id: number;
  name: string;
  createdAt: string;
  userCid?: string;
  authAccountId: string;
  topicId?:string
  channel?:{
    id:number,
    channelCid?:string
  }
}

export interface User {
  id: number;
  name: string;
  createdAt: string;
  userCid?: string;
  authAccountId: string;
  isRegistered?: boolean;
  hasToken?: boolean;
}

export interface TokenResponse {
  token: {
    payload:{
      url:string,
      data:any
    },
    serverSig:string
  };
  accountId: string;
}

export interface LoginReq{
  serverSignature: string;
  originalPayload: {
      url: string;
      data: any;
  };
}

export enum Network {
  ETHEREUM = "eth",
  HEDERA = "hedera",
  BITCOIN = "bitcoin",
}

export enum NetworkType {
  TESTNET = "testnet",
  MAINNET = "mainnet",
}

export enum KeyType {
  ED25519 = "ed25519",
  ECDSA = "ecdsa-secp265k1",
}

export interface DI<N = Network, NT = NetworkType, KT = KeyType> {
  metadata: {
    network: N | string;
    networkType: NT | string;
    accountID: string;
    key: {
      keyType: KT | string;
      key: string;
    };
    encoding:string
  };
  signature: string;
}

export interface ThirdPartyDI {
  authOrg: string;
  issueId: number;
}

export type Signature = string;

export interface UserMetadata {
  metadata: {
    name: string;
    createdAt: string;
    personalInfo?: {
      age?: number;
      dob?: string;
      email?: string[];
      phoneNumber?: string[];
      socials: (string | object)[];
    };
    location?: {
      country?: string;
      state?: string;
    };
    decentralisedIdentity: DI | string;
  };
  signature: Signature;
}

export interface ChannelMetadata {
  metadata: {
    name: string;
    createdAt: string;
    description: string;
    socials: (string | object)[];
    topicId: string;
    userIdentity: string;
    decentralisedIdentity: DI | string;
  };
  signature: Signature;
}

export enum VideoFormats {
  "Matroska" = "mkv",
  "MPEG-4" = "mp4",
}

export enum VideoCodec {
  HEVC = "x265",
  X264 = "x264",
  VP9 = "vp-9",
}

export enum AudioCodec {
  ACC = "acc",
  opus = "opus",
}

export interface Presets<VF = VideoFormats, VC = VideoCodec, AC = AudioCodec> {
  [preset: string]: {
    format: string | VF;
    coding: {
      video: string | VC;
      audio: string | AC;
    };
    cid:string
  };
}

/**
 * @interface
 * IPFS based Video Metadata File interface
 */
export interface VideoMetadata {
  metadata: {
    name: string;
    displayName: string;
    description: string;
    uploadedAt: string;
    channelCid: string;
    videoCid:string
  };
  signature: string;
}

/**
 * @interface Hedera Topic based Video Metadata
 */
export interface VideoMetadataTopic {
  metadata: {
    name: string;
    folderCid: string;
  };
  signature: string;
}


export type VideoToken = {
  id: number
  fileName: string
  fileSize: number
  completed: boolean
  videoId: number
}

/**
 * Model Video
 * 
 */
 export type Video = {
  id: number
  name: string
  displayName: string | null
  uploadedAt: string
  description: string
  videoCid: string | null
  private: boolean
  published: boolean
  ipfsLocation: string | null
  userId: number
  channelId: number
}

/**
 * Model Playlist
 * 
 */
export type Playlist = {
  id: number
  name: string
  createdAt: string
  description: string | null
  userId: number
  channelId: number
}
