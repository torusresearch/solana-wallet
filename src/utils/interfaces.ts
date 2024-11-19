import { PopupWhitelabelData, ProviderConfig } from "@toruslabs/base-controllers";
import { ChainType, SolanaToken } from "@toruslabs/solana-controllers";

export interface SolAndSplToken extends SolanaToken {
  name: string;
  iconURL: string;
  symbol: string;
  isImportToken: boolean;
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
  decimals: number;
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
export interface ThemeParams {
  /**
   * If true, enables dark mode
   * Defaults to false
   * @defaultValue false
   */
  isDark: boolean;
  /**
   * Colors object to customize colors in torus theme.
   *
   * Contact us for whitelabel. Example provided in `examples/vue-app`
   */
  colors: Record<string, string>;
}

export interface LocaleLinks<T> {
  /**
   * Item corresponding to english
   */
  en?: T;
  /**
   * Item corresponding to japanese
   */
  ja?: T;
  /**
   * Item corresponding to korean
   */
  ko?: T;
  /**
   * Item corresponding to german
   */
  de?: T;
  /**
   * Item corresponding to chinese (simplified)
   */
  zh?: T;
  /**
   * Item corresponding to spanish
   */
  es?: T;
}
export interface WhiteLabelParams {
  /**
   * App name to display in the UI
   */
  name?: string;
  /**
   * App url
   */
  url?: string;
  /**
   * Whitelabel theme
   */
  theme?: ThemeParams;
  /**
   * Language of whitelabel.
   *
   * order of preference: Whitelabel language \> user language (in torus-website) \> browser language
   */
  defaultLanguage?: string;
  /**
   * Logo Url to be used in light mode (dark logo)
   */
  logoDark?: string;
  /**
   * Logo Url to be used in dark mode (light logo)
   */
  logoLight?: string;
  /**
   * Shows/hides topup option in torus-website/widget.
   * Defaults to false
   * @defaultValue false
   */
  topupHide?: boolean;
  /**
   * Custom translations. See (examples/vue-app) to configure
   */
  customTranslations?: LocaleLinks<any>;
}

export interface NFTCollection {
  collectionSymbol: string;
  name: string;
  image: string;
  ownerCount: number;
  tokenCount: number;
  totalVol: number;
  vol: number;
  volDelta: number;
  txns: number;
  fp?: number;
  rank: number;
  updatedAt?: number;
}
