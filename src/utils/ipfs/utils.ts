import  stringify  from 'json-stringify-deterministic';
import axios from "axios";
import { Web3Storage, type CIDString } from "web3.storage";
import type { PutOptions } from "web3.storage";

export interface RateLimiter {
  (): Promise<void>;
}

export interface Options {
  token: string;
  endpoint?: URL;
  rateLimiter?: RateLimiter;
}

export interface Filelike {
  /**
   * Name of the file. May include path information.
   */
  name: string;
  /**
   * Returns a ReadableStream which upon reading returns the data contained
   * within the File.
   */
  stream: () => ReadableStream;
}

enum APIGateWays {
  IPFS = "https://ipfs.io",
  DWeb = "https://cid.ipfs.dweb.link",
  Web3Storage = "https://api.web3.storage/car/bafkreihzefx6zlktpw5naitgojqpwqp6qdjy5gabamchv7v2fdqv2zo4vm",
}

type Range = [Number, Number];

export class IpfsStorage {
  public _Web3Storage: Web3Storage;
  private static _IpfsStorage: IpfsStorage;

  constructor(public options: Options) {
    this._Web3Storage = new Web3Storage(options);
    IpfsStorage._IpfsStorage = this;
  }

  static getInstance() {
    if (!this._IpfsStorage) {
      throw new Error("no instance found");
    }
    return this._IpfsStorage;
  }

  uploadFiles<T extends Filelike[] = Filelike[]>(
    files: T,
    options?: PutOptions
  ) {
    return this._Web3Storage.put(files, options);
  }

  getObjectFile<T extends object = any>(obj: T, fileName: string) {
    return new File([stringify(obj)], fileName, {
      type: "application/json",
    });
  }

  convertDataToFile(
    data: Uint8Array,
    fileName: string,
    options?: FilePropertyBag
  ) {
    return new File([data], fileName, options);
  }

  storeFilesWithProgress(
    files: File[],
    options: { name?: string; wrapWithDirectory: boolean },
    afterChunkStored?: (size: number, progress: number) => void,
    afterUpload?: (cid: CIDString) => void
  ) {
    // show the root cid as soon as it's ready
    const onRootCidReady = (cid: CIDString) => {
      afterUpload && afterUpload(cid);
      console.log("uploading files with cid:", cid);
    };

    // when each chunk is stored, update the percentage complete and display
    const totalSize = (files as File[])
      .map((f) => f.size)
      .reduce((a, b) => a + b, 0);

    let uploaded = 0;

    const onStoredChunk = (size: number) => {
      uploaded += size;
      const pct = totalSize / uploaded;
      afterChunkStored && afterChunkStored(size, pct);
      console.log(`Uploading... ${pct.toFixed(2)}% complete`);
    };

    return this.uploadFiles(files, {
      ...options,
      onRootCidReady,
      onStoredChunk,
    });
  }

  getFiles(cid: CIDString) {
    return this._Web3Storage.get(cid);
  }

  getFileUsingGateway<T = any>(cid: CIDString, ...ranges: Range[]) {
    let headers: any = {};
    if (ranges.length > 0) {
      headers["Range"] = ranges.reduce((val: string, range, index) => {
        const rangeString = `${range[0]}-${range[1]}`;
        return (
          val + (index === 0 ? `bytes=${rangeString}` : `, ${rangeString}`)
        );
      }, "");
    }

    return axios.get<T>(`https://${cid}.ipfs.dweb.link`, { headers });
  }
}
let token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDcwNEMxNDUwRTZCOUZFOTlGYmIxRmYwRkEwYTQ0MDVDZTBmMDY2RjIiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NTE2NjIwNzAxMjcsIm5hbWUiOiJmaXJzdC10b2tlbiJ9.KKvn_xN_82XdOc4KXraGRM0NxEPY_jNO6NrTuhL3iiI";

export const ipfsStorage = new IpfsStorage({ token });
