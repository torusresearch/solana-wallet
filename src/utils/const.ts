import { ProviderConfig } from "@toruslabs/base-controllers";
import { SUPPORTED_NETWORKS } from "@toruslabs/solana-controllers";

export const WALLET_SUPPORTED_NETWORKS: { [key: string]: ProviderConfig } = {
  ...SUPPORTED_NETWORKS,
  mainnet: {
    ...SUPPORTED_NETWORKS.mainnet,
    rpcTarget: "https://omniscient-fabled-pool.solana-mainnet.quiknode.pro/c07218c84ba51cac60d68e60364f24225bd5e972",
    // rpcTarget: "https://nyc39.rpcpool.com",
  },
  testnet: {
    ...SUPPORTED_NETWORKS.testnet,
    rpcTarget: "https://ultra-damp-bird.solana-testnet.quiknode.pro/b1240036081a1d63254c1ca44b5554e77fc0e880",
  },
  devnet: {
    ...SUPPORTED_NETWORKS.devnet,
    rpcTarget: "https://misty-lively-lambo.solana-devnet.quiknode.pro/cc27b365f0921950469287299c1491d302182c69",
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
