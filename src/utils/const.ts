import { SUPPORTED_NETWORKS } from "@toruslabs/solana-controllers";

export const WALLET_SUPPORTED_NETWORKS = {
  ...SUPPORTED_NETWORKS,
  mainnet: {
    ...SUPPORTED_NETWORKS.mainnet,
    rpcTarget: "https://solana-mainnet.phantom.tech",
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
