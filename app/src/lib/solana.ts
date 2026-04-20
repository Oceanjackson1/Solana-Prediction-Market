import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { RPC_URL } from "./constants";

const WS_URL = RPC_URL.replace(/^http/i, "ws");

export const rpc = createSolanaRpc(RPC_URL);
export const rpcSubscriptions = createSolanaRpcSubscriptions(WS_URL);
