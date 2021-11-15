import { TokenInfo } from "@solana/spl-token-registry";
import { SolanaTransactionActivity } from "@toruslabs/solana-controllers";
import { computed } from "vue";

import SolanaLightLogoURL from "@/assets/solana-mascot.svg";
import ControllerModule from "@/modules/controllers";

const selectedAddress = computed(() => ControllerModule.torus.selectedAddress);
export enum TransactionDirection {
  "SENT" = "Sent",
  "RECEIVED" = "Received",
}

export enum TransactionType {
  "SPL" = "spl-token",
}

export interface FormattedTransaction {
  tokenName: string;
  direction: TransactionDirection; // from current accounts POV
  amount: string;
  participant_address: string;
  logoURI: string;
}
export function getTokenData(mintAddress: string): TokenInfo | undefined {
  const tokenList = JSON.parse(`${localStorage.getItem("SPL_TOKEN_LIST")}`)?.data;
  return tokenList.find((token: TokenInfo) => token.address === mintAddress) || undefined;
}

export function getFormattedTransactionData(activity: SolanaTransactionActivity): FormattedTransaction {
  const data: FormattedTransaction = {
    amount: "0",
    direction: TransactionDirection.SENT,
    participant_address: "",
    tokenName: activity.transactionType === TransactionType.SPL ? "Spl tokens" : "Sol",
    logoURI: SolanaLightLogoURL,
  };
  if (activity.transactionType === TransactionType.SPL) {
    // SPL token
    const pre = activity.meta.preTokenBalances;
    const post = activity.meta.postTokenBalances;
    const preData: { [key: string]: number } = {
      [pre[0].owner]: pre[0].uiTokenAmount.uiAmount,
      [pre[1].owner]: pre[1].uiTokenAmount.uiAmount,
    };
    const postData: { [key: string]: number } = {
      [post[0].owner]: post[0].uiTokenAmount.uiAmount,
      [post[1].owner]: post[1].uiTokenAmount.uiAmount,
    };
    data.direction = preData[selectedAddress.value] > postData[selectedAddress.value] ? TransactionDirection.SENT : TransactionDirection.RECEIVED;
    data.amount = `${Number(Math.abs(preData[selectedAddress.value] - postData[selectedAddress.value] || 0).toFixed(4))}`;
    data.participant_address = `${Object.keys(postData).find((v) => v !== selectedAddress.value)}`;

    const tokenMetadata = getTokenData(pre[0].mint);
    if (tokenMetadata?.extensions) {
      data.logoURI = `${tokenMetadata.logoURI}`;
      data.tokenName = tokenMetadata.symbol;
    }
  } else {
    // SOL Token
    data.amount = `${activity.totalAmountString}`;
    data.direction = activity.send ? TransactionDirection.SENT : TransactionDirection.RECEIVED;
    data.participant_address = `${activity.send ? activity.to : activity.from}`;
  }
  return data;
}
