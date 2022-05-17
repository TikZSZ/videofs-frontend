import { privKey } from './../../env';
import {
  Client,
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  TokenUpdateTransaction,
  ContractExecuteTransaction,
  TokenInfoQuery,
  AccountBalanceQuery,
  Hbar,
  TransactionId,
  PublicKey,
  TransactionReceipt,
  FileId,
} from "@hashgraph/sdk";
import { wallet } from "../wallet";
// @ts-ignore
//import file from "./MintAssociateTransferHTS_sol_MintAssoTransHTS.bin";
import { file } from './file';
// const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
// const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
// const treasuryId = AccountId.fromString(process.env.TREASURY_ID);
// const treasuryKey = PrivateKey.fromString(process.env.TREASURY_PVKEY);
// const aliceId = AccountId.fromString(process.env.ALICE_ID);
// const aliceyKey = PrivateKey.fromString(process.env.ALICE_PVKEY);
const opratorId = "0.0.34357253"
const operatorKey = privKey
const client = Client.forTestnet().setOperator(opratorId, operatorKey);


async function tokenCreate(accountId: string, pubKey: PublicKey) {
  const txn = new TokenCreateTransaction()
    .setTokenName("VideoFS")
    .setTokenSymbol("VFS")
    .setDecimals(0)
    .setInitialSupply(100)
    .setTreasuryAccountId(accountId)
    .setAdminKey(pubKey)
    .setSupplyKey(pubKey)
    .setNodeAccountIds([new AccountId(3)])
    .setTransactionId(TransactionId.generate(AccountId.fromString(accountId)))
    .freeze();
  const results = await wallet.sendTransaction(txn.toBytes(), {
    returnTransaction: false,
    accountToSign: accountId,
    getRecord: true,
  });
  if (results.success) {
    return results;
  } else {
    throw new Error("couldnt create token");
  }
}

async function fileCreate(accountId: string, pubKey: PublicKey) {
  const txn = new FileCreateTransaction()
    .setKeys([pubKey])
    .setNodeAccountIds([new AccountId(3)])
    .setTransactionId(TransactionId.generate(AccountId.fromString(accountId)))
    .freeze();
  const results = await wallet.sendTransaction(txn.toBytes(), {
    returnTransaction: false,
    accountToSign: accountId,
    getRecord: true,
  });
  if (results.success) {
    return results;
  } else {
    throw new Error("couldnt create token");
  }
}

async function appenFile(
  bytecodeFileId: FileId,
  bytecode: any,
  accountId: string
) {
  const txn = new FileAppendTransaction()
    .setFileId(bytecodeFileId!)
    .setContents(bytecode)
    .setMaxChunks(10)
    .setNodeAccountIds([new AccountId(3)])
    .setTransactionId(TransactionId.generate(AccountId.fromString(accountId)))
    .freeze();
  const results = await wallet.sendTransaction(txn.toBytes(), {
    returnTransaction: false,
    accountToSign: accountId,
    getRecord: true,
  });
  if (results.success) {
    return results;
  } else {
    throw new Error("couldnt create token");
  }
}

async function contractCreateFunction(
  bytecodeFileId: FileId,
  tokenAddressSol: string,
  accountId: string
) {
  const txn = new ContractCreateTransaction()
    .setBytecodeFileId(bytecodeFileId!)
    .setGas(3000000)
    .setConstructorParameters(
      new ContractFunctionParameters().addAddress(tokenAddressSol)
    )
    .setNodeAccountIds([new AccountId(3)])
    .setTransactionId(TransactionId.generate(AccountId.fromString(accountId)))
    .freeze();
  const results = await wallet.sendTransaction(txn.toBytes(), {
    returnTransaction: false,
    accountToSign: accountId,
    getRecord: true,
  });
  if (results.success) {
    return results;
  } else {
    throw new Error("couldnt create token");
  }
}

async function tokenUpdate(tokenId:any,contractId:any,accountId:string){
	const txn =  new TokenUpdateTransaction()
    .setTokenId(tokenId!)
    .setSupplyKey(contractId!)
    .setNodeAccountIds([new AccountId(3)])
    .setTransactionId(TransactionId.generate(AccountId.fromString(accountId)))
    .freeze();
		const results = await wallet.sendTransaction(txn.toBytes(), {
			returnTransaction: false,
			accountToSign: accountId,
			getRecord: true,
		});
		if (results.success) {
			return results;
		} else {
			throw new Error("couldnt create token");
		}	
}

export async function main(accId: string, pubKey: PublicKey) {
  // STEP 1 ===================================
  console.log(`STEP 1 ===================================`);
  const bytecode = file;
  console.log(`- Done \n`);

  // STEP 2 ===================================
  console.log(`STEP 2 ===================================`);
  // const accId = store.selectedAccount;
  // const pubKey = PublicKey.fromString(store.user!.key!);
  //Create a fungible token
  const tokenCreateTx = await tokenCreate(accId, pubKey);
  const tokenCreateRx = TransactionReceipt.fromBytes(tokenCreateTx.receipt!);
  const tokenId = tokenCreateRx.tokenId;
  const tokenAddressSol = tokenId!.toSolidityAddress();
  console.log(`- Token ID: ${tokenId}`);
  console.log(`- Token ID in Solidity format: ${tokenAddressSol}`);

  // Token query
  const tokenInfo1 = await tQueryFcn(tokenId);
  console.log(`- Initial token supply: ${tokenInfo1.totalSupply.low} \n`);

  //Create a file on Hedera and store the contract bytecode
  const fileCreateTx = await fileCreate(accId, pubKey);
  const fileCreateRx = TransactionReceipt.fromBytes(fileCreateTx.receipt!);
  const bytecodeFileId = fileCreateRx.fileId;
  console.log(`- The smart contract bytecode file ID is ${bytecodeFileId}`);

  // Append contents to the file
  const fileAppendTx = await appenFile(bytecodeFileId!, bytecode, accId);
  const fileAppendRx = TransactionReceipt.fromBytes(fileAppendTx.receipt!);
  console.log(`- Content added: ${fileAppendRx.status} \n`);

  // STEP 3 ===================================
  console.log(`STEP 3 ===================================`);
  // Create the smart contract
  const contractInstantiateTx = await contractCreateFunction(
    bytecodeFileId!,
    tokenAddressSol,
    accId
  );

  const contractInstantiateRx = TransactionReceipt.fromBytes(
    contractInstantiateTx.receipt!
  );
  const contractId = contractInstantiateRx.contractId;
  const contractAddress = contractId!.toSolidityAddress();
  console.log(`- The smart contract ID is: ${contractId}`);
  console.log(
    `- The smart contract ID in Solidity format is: ${contractAddress} \n`
  );

  // Token query 2.1
  const tokenInfo2p1 = await tQueryFcn(tokenId);
  console.log(`- Token supply key: ${tokenInfo2p1.supplyKey!.toString()}`);

  // Update the fungible so the smart contract manages the supply
  const tokenUpdateTx = await tokenUpdate(tokenId!,contractId!,accId)
  const tokenUpdateRx = TransactionReceipt.fromBytes(
    tokenUpdateTx.receipt!
  );
  console.log(`- Token update status: ${tokenUpdateRx.status}`);

  // Token query 2.2
  const tokenInfo2p2 = await tQueryFcn(tokenId);
  console.log(`- Token supply key: ${tokenInfo2p2.supplyKey!.toString()} \n`);

  // // STEP 4 ===================================
  // console.log(`STEP 4 ===================================`);
  // //Execute a contract function (mint)
  // const contractExecTx = await new ContractExecuteTransaction()
  //   .setContractId(contractId!)
  //   .setGas(3000000)
  //   .setFunction(
  //     "mintFungibleToken",
  //     new ContractFunctionParameters().addUint64(150 as any)
  //   );
  // const contractExecSubmit = await contractExecTx.execute(client);
  // const contractExecRx = await contractExecSubmit.getReceipt(client);
  // console.log(`- New tokens minted: ${contractExecRx.status.toString()}`);

  // // Token query 3
  // const tokenInfo3 = await tQueryFcn(tokenId);
  // console.log(`- New token supply: ${tokenInfo3.totalSupply.low} \n`);

  // //Execute a contract function (associate)
  // const contractExecTx1 = await new ContractExecuteTransaction()
  //   .setContractId(contractId!)
  //   .setGas(3000000)
  //   .setFunction(
  //     "tokenAssociate",
  //     new ContractFunctionParameters().addAddress(aliceId.toSolidityAddress())
  //   )
  //   .freezeWith(client);
  // const contractExecSign1 = await contractExecTx1.sign(aliceyKey);
  // const contractExecSubmit1 = await contractExecSign1.execute(client);
  // const contractExecRx1 = await contractExecSubmit1.getReceipt(client);
  // console.log(
  //   `- Token association with Alice's account: ${contractExecRx1.status.toString()} \n`
  // );

  //Execute a contract function (transfer)
  // const contractExecTx2 = await new ContractExecuteTransaction()
  // 	.setContractId(contractId!)
  // 	.setGas(3000000)
  // 	.setFunction(
  // 		"tokenTransfer",
  // 		new ContractFunctionParameters()
  // 			.addAddress(treasuryId.toSolidityAddress())
  // 			.addAddress(aliceId.toSolidityAddress())
  // 			.addInt64(50 as any)
  // 	)
  // 	.freezeWith(client);
  // const contractExecSign2 = await contractExecTx2.sign(treasuryKey);
  // const contractExecSubmit2 = await contractExecSign2.execute(client);
  // const contractExecRx2 = await contractExecSubmit2.getReceipt(client);

  // console.log(`- Token transfer from Treasury to Alice: ${contractExecRx2.status.toString()}`);

  // const tB = await bCheckerFcn(treasuryId!);
  // const aB = await bCheckerFcn(aliceId!);
  // console.log(`- Treasury balance: ${tB} units of token ${tokenId}`);
  // console.log(`- Alice balance: ${aB} units of token ${tokenId} \n`);

  // ========================================
  // FUNCTIONS
  async function tQueryFcn(tId: any) {
    let info = await new TokenInfoQuery().setTokenId(tId).execute(client);
    return info;
  }

  async function bCheckerFcn(aId: string) {
    let balanceCheckTx = await new AccountBalanceQuery()
      .setAccountId(aId)
      .execute(client);
    return balanceCheckTx.tokens!._map.get(tokenId!.toString());
  }
}
//main();
