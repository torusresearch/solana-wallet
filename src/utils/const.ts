import { ProviderConfig } from "@toruslabs/base-controllers";
import { SUPPORTED_NETWORKS } from "@toruslabs/solana-controllers";

export const WALLET_SUPPORTED_NETWORKS: { [key: string]: ProviderConfig } = {
  ...SUPPORTED_NETWORKS,
  mainnet: {
    ...SUPPORTED_NETWORKS.mainnet,
    rpcTarget: "https://green-dark-sky.solana-mainnet.quiknode.pro/0b4b99540b7930cf590dc7fb0a2d1c9a906fd53c/",
  },
  testnet: {
    ...SUPPORTED_NETWORKS.testnet,
    rpcTarget: "https://spring-black-waterfall.solana-testnet.quiknode.pro/89830c37acd15df105b23742d37f33dc85b5eff8/",
  },
  devnet: {
    ...SUPPORTED_NETWORKS.devnet,
    rpcTarget: "https://api.devnet.solana.com",
  },
  invalid: {
    ...SUPPORTED_NETWORKS.devnet,
    displayName: "Network Error",
    chainId: "loading",
  },
};

// testnet: {
//   blockExplorerUrl: "?cluster=testnet",
//   chainId: "0x2",
//   displayName: "Solana Testnet",
//   logo: "solana.svg",
//   rpcTarget: "https://spring-frosty-sky.solana-testnet.quiknode.pro/060ad86235dea9b678fc3e189e9d4026ac876ad4/",
//   ticker: "SOL",
//   tickerName: "Solana Token",
// },
