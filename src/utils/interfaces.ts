import { SolanaToken } from "@toruslabs/solana-controllers";

export interface SolAndSplToken extends SolanaToken {
  name: string;
  iconURL: string;
  symbol: string;
}

export interface ClubbedNfts {
  title: string;
  img: string;
  count: number;
  description: string;
  mints: string[];
  collectionName: string;
}

export interface AccountEstimation {
  changes: number;
  symbol: string;
  mint: string;
  address: string;
}
