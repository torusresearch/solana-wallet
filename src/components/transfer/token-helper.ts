import log from "loglevel";
import { computed } from "vue";

import solicon from "@/assets/solana-mascot.svg";
import ControllerModule from "@/modules/controllers";
import { SolAndSplToken } from "@/utils/interfaces";

const SOLANA_TOKEN: Partial<SolAndSplToken> = {
  name: "Solana",
  iconURL: solicon,
  symbol: "SOL",
  isFungible: true,
};

// concat SOL + SPL tokens
export const tokens = computed<Partial<SolAndSplToken>[]>(() => {
  return [
    SOLANA_TOKEN,
    ...(ControllerModule.fungibleTokens?.map((st) => {
      return { ...st, name: st.data?.name || "", iconURL: `${st.data?.logoURI}` || "", symbol: st.data?.symbol };
    }) || []),
  ];
});

export const nftTokens = computed<Partial<SolAndSplToken>[]>(() => {
  return ControllerModule.nonFungibleTokens?.map((st) => {
    return {
      ...st,
      name: st.metaplexData?.offChainMetaData?.name || "",
      iconURL: `${st.metaplexData?.offChainMetaData?.image}` || "",
      symbol: st.metaplexData?.offChainMetaData?.symbol,
    };
  });
});

export function getTokenFromMint(tokenList: Partial<SolAndSplToken>[], mint: string): Partial<SolAndSplToken> | undefined {
  const token = tokenList.find((el) => el.mintAddress === mint);
  log.info(token);
  return token;
}
