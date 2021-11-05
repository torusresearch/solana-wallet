import { SolanaTransactionActivity } from "@toruslabs/solana-controllers";

import SolanaLightLogoURL from "@/assets/solana-mascot.svg";
import { getTokenData } from "@/components/transfer/token-helper";
import ControllerModule from "@/modules/controllers";

const selectedAddress: string = ControllerModule.torusState.PreferencesControllerState.selectedAddress;

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
    data.direction = preData[selectedAddress] > postData[selectedAddress] ? TransactionDirection.SENT : TransactionDirection.RECEIVED;
    data.amount = Number(Math.abs(preData[selectedAddress] - postData[selectedAddress] || 0).toFixed(4)) + "";
    data.participant_address = Object.keys(postData).find((v) => v !== selectedAddress) + "";

    const tokenMetadata = getTokenData(pre[0].mint);
    if (tokenMetadata?.extensions) {
      console.log("TOKEN", tokenMetadata);
      data.logoURI = tokenMetadata.logoURI + "";
      data.tokenName = tokenMetadata.symbol;
    }
  } else {
    // SOL Token
    data.amount = activity.totalAmountString + "";
    data.direction = activity.send ? TransactionDirection.SENT : TransactionDirection.RECEIVED;
    data.participant_address = (activity.send ? activity.to : activity.from) + "";
  }
  return data;
}

export interface FormattedTransaction {
  tokenName: string;
  direction: TransactionDirection; // from current accounts POV
  amount: string;
  participant_address: string;
  logoURI: string;
}

export enum TransactionDirection {
  "SENT" = "Sent",
  "RECEIVED" = "Received",
}

export enum TransactionType {
  "SPL" = "spl-token",
}
