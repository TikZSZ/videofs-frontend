import { AccountId,TopicMessageSubmitTransaction, TransactionId } from '@hashgraph/sdk';
import stringify from 'json-stringify-deterministic';
import { addChunksMetaToMessage } from './crypto/cryptoUtil';
import {Buffer} from "buffer"
export function getSendMsgTxn(message:object|string,topicId:string,accountId:string) {
  const {messageWithChunks} = addChunksMetaToMessage(Buffer.from(typeof message == "string" ? message : stringify(message)))
  return new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(Buffer.from(messageWithChunks).toString())
    .setNodeAccountIds([new AccountId(3)])
    .setTransactionId(
      TransactionId.generate(AccountId.fromString(accountId))
    )
    .freeze();
}