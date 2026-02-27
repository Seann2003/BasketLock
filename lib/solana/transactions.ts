import {
  type Address,
  type IInstruction,
  type Rpc,
  type RpcSubscriptions,
  type GetLatestBlockhashApi,
  type GetEpochInfoApi,
  type GetSignatureStatusesApi,
  type SendTransactionApi,
  type SignatureNotificationsApi,
  type SlotNotificationsApi,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  compileTransaction,
  signTransaction,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
} from "@solana/kit";

type TransactionRpc = Rpc<
  GetLatestBlockhashApi & GetEpochInfoApi & GetSignatureStatusesApi & SendTransactionApi
>;
type TransactionRpcSubscriptions = RpcSubscriptions<
  SignatureNotificationsApi & SlotNotificationsApi
>;

export async function buildTransaction(
  rpc: TransactionRpc,
  instructions: IInstruction[],
  payer: Address,
) {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (msg) => setTransactionMessageFeePayer(payer, msg),
    (msg) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, msg),
    (msg) => appendTransactionMessageInstructions(instructions, msg),
  );

  return {
    transaction: compileTransaction(message),
    latestBlockhash,
  };
}

export async function buildAndSendTransaction(
  rpc: TransactionRpc,
  rpcSubscriptions: TransactionRpcSubscriptions,
  instructions: IInstruction[],
  payer: Address,
  signTx: (tx: Parameters<typeof signTransaction>[1]) => Promise<ReturnType<typeof signTransaction>>,
  keyPairs?: CryptoKeyPair[],
) {
  const { transaction, latestBlockhash } = await buildTransaction(rpc, instructions, payer);

  let signed;
  if (keyPairs && keyPairs.length > 0) {
    signed = await signTransaction(keyPairs, transaction);
  } else {
    signed = await signTx(transaction);
  }

  const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
  await sendAndConfirm(signed, { commitment: "confirmed" });

  return getSignatureFromTransaction(signed);
}
