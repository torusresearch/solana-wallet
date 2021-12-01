import { SolanaToken } from "@toruslabs/solana-controllers";
import { computed } from "vue";

import solicon from "@/assets/solana-mascot.svg";
import ControllersModule from "@/modules/controllers";

const SOLANA_TOKEN = {
  name: "Solana",
  iconURL: solicon,
  symbol: "SOL",
};

export interface SolAndSplToken extends SolanaToken {
  name: string;
  iconURL: string;
  symbol: string;
}

const onlySplTokens = computed<SolanaToken[] | undefined>(() => ControllersModule.torus.tokens?.[ControllersModule.torus.selectedAddress]);

// concat SOL + SPL tokens
export const tokens = computed<Partial<SolAndSplToken>[]>(() => {
  return [
    SOLANA_TOKEN,
    ...(onlySplTokens?.value?.map((st) => {
      return { ...st, name: st.data?.name || "", iconURL: `${st.data?.logoURI}` || "", symbol: st.data?.symbol };
    }) || []),
  ];
});
