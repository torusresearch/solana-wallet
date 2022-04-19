import { SUPPORTED_NETWORKS } from "@toruslabs/solana-controllers";

export const WALLET_SUPPORTED_NETWORKS = {
  ...SUPPORTED_NETWORKS,
  mainnet: {
    ...SUPPORTED_NETWORKS.mainnet,
    rpcTarget: "https://green-dark-sky.solana-mainnet.quiknode.pro/0b4b99540b7930cf590dc7fb0a2d1c9a906fd53c/",
  },
  testnet: {
    ...SUPPORTED_NETWORKS.testnet,
    rpcTarget: "https://api.google.testnet.solana.com",
  },
  devnet: {
    ...SUPPORTED_NETWORKS.devnet,
    rpcTarget: "https://api.google.devnet.solana.com",
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
