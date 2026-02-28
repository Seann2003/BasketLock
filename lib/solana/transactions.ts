import {
  type Address,
  type Instruction,
  type Rpc,
  type RpcSubscriptions,
  type GetLatestBlockhashApi,
  type GetEpochInfoApi,
  type GetSignatureStatusesApi,
  type SendTransactionApi,
  type SignatureNotificationsApi,
  type SlotNotificationsApi,
  type Transaction,
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
  instructions: Instruction[],
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
  instructions: Instruction[],
  payer: Address,
  keyPairs: CryptoKeyPair[],
) {
  const { transaction } = await buildTransaction(rpc, instructions, payer);

  const signed = await signTransaction(keyPairs, transaction);

  const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await sendAndConfirm(signed as any, { commitment: "confirmed" });

  return getSignatureFromTransaction(signed);
}
