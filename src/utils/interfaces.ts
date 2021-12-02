import { SolanaToken } from "@toruslabs/solana-controllers";

export interface SolAndSplToken extends SolanaToken {
  name: string;
  iconURL: string;
  symbol: string;
}
