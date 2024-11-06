import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { computed } from "vue";

import solicon from "@/assets/solana-logo-light.svg";
import ControllerModule from "@/modules/controllers";
import { SORT_SPL_TOKEN } from "@/utils/enums";
import { sortSolanaTokens } from "@/utils/helpers";
import { SolAndSplToken } from "@/utils/interfaces";

const SOLANA_TOKEN: Partial<SolAndSplToken> = {
  name: "Solana",
  iconURL: solicon,
  symbol: "SOL",
  isFungible: true,
};

// concat SOL + SPL tokens
export const tokens = computed<Partial<SolAndSplToken>[]>(() => {
  const customTokens = ControllerModule.userCustomTokens;

  const solToken = {
    ...SOLANA_TOKEN,
    balance: {
      amount: ControllerModule.solBalance.multipliedBy(LAMPORTS_PER_SOL).toString(),
      decimals: 9,
      uiAmount: ControllerModule.solBalance.toNumber(),
      uiAmountString: ControllerModule.solBalance.toFixed(4),
    },
  };

  const fungibleTokens = sortSolanaTokens(
    ControllerModule.fungibleTokens?.map((st) => {
      return { ...st, name: st.data?.name || "", iconURL: st.data?.logoURI ? `${st.data?.logoURI}` : "", symbol: st.data?.symbol };
    }) || [],
    SORT_SPL_TOKEN.TOKEN_CURRENCY_VALUE,
    ControllerModule.torusState.CurrencyControllerState.currentCurrency
  );

  const customTokensFormatted = customTokens.map((ct) => {
    return { ...ct, name: ct.data?.name || "", iconURL: ct.data?.logoURI ? `${ct.data?.logoURI}` : "", symbol: ct.data?.symbol };
  });

  return [solToken, ...fungibleTokens, ...customTokensFormatted];
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
  return token;
}
