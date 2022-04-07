import { ProviderConfig } from "@toruslabs/base-controllers";
import { SUPPORTED_NETWORKS } from "@toruslabs/solana-controllers";
// override default config here.
export const WALLET_SUPPORTED_NETWORKS: { [name: string]: ProviderConfig } = {
  ...SUPPORTED_NETWORKS,
  mainnet_serum: {
    blockExplorerUrl: "https://explorer.solana.com",
    chainId: "0x1",
    displayName: "Project Serum Mainnet ",
    logo: "solana.svg",
    rpcTarget: "https://solana-api.projectserum.com/",
    ticker: "SOL",
    tickerName: "Solana Token",
  } as ProviderConfig,
  mainnet_google: {
    blockExplorerUrl: "https://explorer.solana.com",
    chainId: "0x1",
    displayName: "Google Mainnet",
    logo: "solana.svg",
    rpcTarget: "https://api.google.mainnet-beta.solana.com/",
    ticker: "SOL",
    tickerName: "Solana Token",
  } as ProviderConfig,
  mainnet_genesysgo: {
    blockExplorerUrl: "https://explorer.solana.com",
    chainId: "0x1",
    displayName: "Genesysgo Mainnet",
    logo: "solana.svg",
    rpcTarget: "https://ssc-dao.genesysgo.net/",
    ticker: "SOL",
    tickerName: "Solana Token",
  } as ProviderConfig,
  testnet_google: {
    blockExplorerUrl: "https://explorer.solana.com",
    chainId: "0x2",
    displayName: "Google Testnet",
    logo: "solana.svg",
    rpcTarget: "https://api.google.testnet.solana.com/",
    ticker: "SOL",
    tickerName: "Solana Token",
  } as ProviderConfig,
  devnet_google: {
    blockExplorerUrl: "https://explorer.solana.com",
    chainId: "0x3",
    displayName: "Google Devnet",
    logo: "solana.svg",
    rpcTarget: "https://api.google.devnet.solana.com/",
    ticker: "SOL",
    tickerName: "Solana Token",
  } as ProviderConfig,
};
