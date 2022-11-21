import { SUPPORTED_NETWORKS } from "@toruslabs/solana-controllers";

export const WALLET_SUPPORTED_NETWORKS = {
  ...SUPPORTED_NETWORKS,
  mainnet: {
    ...SUPPORTED_NETWORKS.mainnet,
    rpcTarget: "https://green-dark-sky.solana-mainnet.quiknode.pro/97c87069b81ef4ec0765a267525c82153e5404fc/",
  },
  testnet: {
    ...SUPPORTED_NETWORKS.testnet,
    rpcTarget: "https://spring-black-waterfall.solana-testnet.quiknode.pro/89830c37acd15df105b23742d37f33dc85b5eff8/",
  },
  devnet: {
    ...SUPPORTED_NETWORKS.devnet,
    rpcTarget: "https://api.devnet.solana.com",
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
