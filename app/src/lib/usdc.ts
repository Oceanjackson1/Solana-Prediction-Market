import {
  address,
  getProgramDerivedAddress,
  getAddressEncoder,
  type Address,
} from "@solana/kit";
import { rpc } from "./solana";
import { USDC_MINT_DEVNET, USDC_DECIMALS } from "./constants";

const TOKEN_PROGRAM_ID = address(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);
const ASSOCIATED_TOKEN_PROGRAM_ID = address(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);

const addrEnc = getAddressEncoder();

export async function deriveAta(
  owner: Address,
  mint: Address = USDC_MINT_DEVNET,
): Promise<Address> {
  const [ata] = await getProgramDerivedAddress({
    programAddress: ASSOCIATED_TOKEN_PROGRAM_ID,
    seeds: [
      addrEnc.encode(owner),
      addrEnc.encode(TOKEN_PROGRAM_ID),
      addrEnc.encode(mint),
    ],
  });
  return ata;
}

export async function getUsdcBalance(owner: Address): Promise<number> {
  const ata = await deriveAta(owner, USDC_MINT_DEVNET);
  try {
    const { value } = await rpc.getTokenAccountBalance(ata).send();
    return Number(value.uiAmountString ?? "0");
  } catch {
    return 0;
  }
}

export function formatUsdc(raw: bigint | number): string {
  const n = typeof raw === "bigint" ? Number(raw) : raw;
  return (n / 10 ** USDC_DECIMALS).toFixed(2);
}
