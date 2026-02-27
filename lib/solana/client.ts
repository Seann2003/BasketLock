import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";

type BasketlockClient = {
  rpc: ReturnType<typeof createSolanaRpc>;
  rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
};

let clientInstance: BasketlockClient | null = null;

export function createBasketlockClient(
  endpoint: string,
  wsEndpoint?: string,
): BasketlockClient {
  const rpc = createSolanaRpc(endpoint);
  const ws = wsEndpoint ?? endpoint.replace("https", "wss");
  const rpcSubscriptions = createSolanaRpcSubscriptions(ws);
  return { rpc, rpcSubscriptions };
}

export function getClient(): BasketlockClient {
  if (!clientInstance) {
    const endpoint = process.env.NEXT_PUBLIC_RPC_URL;
    if (!endpoint) {
      throw new Error("NEXT_PUBLIC_RPC_URL is not set");
    }
    clientInstance = createBasketlockClient(endpoint);
  }
  return clientInstance;
}
