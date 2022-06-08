import { PopupWhitelabelData, ProviderConfig } from "@toruslabs/base-controllers";
import { ChainType, SolanaToken } from "@toruslabs/solana-controllers";

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

export interface ProviderChangeChannelEventData {
  newNetwork: ProviderConfig;
  origin: string;
  currentNetwork: ChainType;
  whitelabelData: PopupWhitelabelData;
}
export interface FinalTxData {
  slicedSenderAddress: string;
  slicedReceiverAddress: string;
  totalSolAmount: number;
  totalSolFee: number;
  totalFiatAmount: string;
  totalFiatFee: string;
  transactionType: string;
  totalSolCost: string;
  totalFiatCost: string;
  isGasless: boolean;
}
