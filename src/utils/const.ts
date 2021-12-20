import { ProviderConfig } from "@toruslabs/base-controllers";
import { SUPPORTED_NETWORKS } from "@toruslabs/solana-controllers";

export const WALLET_SUPPORTED_NETWORKS = {
  ...SUPPORTED_NETWORKS,
};

export const FALLBACK_NETWORKS = {
  mainnet: {
    ...WALLET_SUPPORTED_NETWORKS.mainnet,
    rpcTarget: "https://solana-mainnet.phantom.tech", // or "https://solana-api.projectserum.com" (activities endpoint not working),
  } as ProviderConfig,
  testnet: {
    ...WALLET_SUPPORTED_NETWORKS.testnet,
    rpcTarget: "https://ancient-delicate-dew.solana-testnet.quiknode.pro/c5ce24a6976f9dc836ca8a49e577224844fbc3e7/",
  } as ProviderConfig,
  devnet: {
    ...WALLET_SUPPORTED_NETWORKS.devnet,
    rpcTarget: "https://lingering-weathered-bush.solana-devnet.quiknode.pro/39071fb16fc915dcbc5eb31f211b8ca588219ff3/",
  } as ProviderConfig,
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
