import { computed } from "vue";

import solicon from "@/assets/solana-mascot.svg";
import ControllersModule from "@/modules/controllers";
import { SolAndSplToken } from "@/utils/interfaces";

const SOLANA_TOKEN: Partial<SolAndSplToken> = {
  name: "Solana",
  iconURL: solicon,
  symbol: "SOL",
  isFungible: true,
};

// const onlySplTokens = computed<SolanaToken[] | undefined>(() => ControllersModule.torus.tokens?.[ControllersModule.torus.selectedAddress]);

// concat SOL + SPL tokens
export const tokens = computed<Partial<SolAndSplToken>[]>(() => {
  return [
    SOLANA_TOKEN,
    ...(ControllersModule.fungibleTokens?.map((st) => {
      return { ...st, name: st.data?.name || "", iconURL: `${st.data?.logoURI}` || "", symbol: st.data?.symbol };
    }) || []),
  ];
});

export const nftTokens = computed<Partial<SolAndSplToken>[]>(() => {
  return ControllersModule.nonFungibleTokens?.map((st) => {
    return {
      ...st,
      name: st.metaplexData?.name || "",
      iconURL: `${st.metaplexData?.offChainMetaData?.image}` || "",
      symbol: st.metaplexData?.symbol,
    };
  });
});

export function getTokenFromMint(tokenList: Partial<SolAndSplToken>[], mint: string) {
  return tokenList.find((el) => el.mintAddress === mint);
}
