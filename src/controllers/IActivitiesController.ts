import { BaseConfig, BaseState, TransactionStatus } from "@toruslabs/base-controllers";

export interface SolanaTransactionActivity {
  id?: number;
  status: TransactionStatus;
  updatedAt?: number; // iso date string
  signature: string;
  slot?: string;
  rawTransaction?: string;
  txReceipt?: unknown;
  error?: Error;
  warning?: {
    error?: string;
    message?: string;
  };
  action: string;
  to?: string;
  from?: string;
  cryptoAmount?: number;
  cryptoCurrency?: string;
  decimal: number;
  transaction?: string;
  fee?: number;
  send?: boolean;
  type: string;

  currency?: string;
  currencyAmount?: number;

  totalAmountString?: string;
  blockExplorerUrl: string;
  transactionType?: string;
  meta?: any;
  chainId: string;
  network: string;
  rawDate: string;
  logoURI?: string;
  mintAddress?: string;
}

export interface FetchedTransaction {
  id: number;
  from: string;
  to: string;
  crypto_amount: string;
  crypto_currency: string;
  decimal: number;
  currency_amount: string;
  selected_currency: string;
  // raw_transaction: string;
  is_cancel: boolean;
  status: string;
  network: string;
  signature: string;
  transaction_category: string;
  fee: string;
  gasless: boolean;
  gasless_relayer_public_key: string;
  mint_address: string;
  created_at: string;
  updated_at: string;
}

export interface TopupOrderTransaction {
  action: string;
  amount: string;
  currencyAmountString: string;
  currencyUsed: string;
  date: string;
  ethRate: string;
  etherscanLink?: string;
  from: string;
  id: string;
  slicedFrom: string;
  slicedTo: string;
  solana: {
    amount: string;
    currencyAmount: string;
    currencyUsed: string;
    decimal?: string;
    rate: string;
    signature?: string;
    symbol: string;
  };
  status: string;
  to: string;
  totalAmount: string;
  totalAmountString: string;
}

export interface ActivitiesControllerState extends BaseState {
  accounts: {
    [selectedAddress: string]: {
      topupTransaction: TopupOrderTransaction[];
      backendTransactions: FetchedTransaction[];
      activities: {
        [key: string]: SolanaTransactionActivity;
      };
    };
  };
  state: string;
  loading: boolean;
}
export type ActivitiesControllerConfig = BaseConfig;
