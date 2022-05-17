import { PrivateKey } from "@hashgraph/sdk";
import {Buffer} from "buffer"
// @ts-ignore
import stringify from "json-stringify-deterministic"

export default  function signature<T>(privateKey:string,data:string|object,msgEncoding:string = "base64"){
  const pKey = PrivateKey.fromString(privateKey);
	//const msg = new TextEncoder().encode(data);
  let msg:string
  if(typeof data === 'string') msg = data
  else msg = stringify(data) as string
	const UInt8Msg = Buffer.from(msg,msgEncoding);
	const signature = pKey.sign(UInt8Msg);
  return {UInt8Signature:signature,base64Signature:Buffer.from(signature).toString('base64')}
}

export {signature}