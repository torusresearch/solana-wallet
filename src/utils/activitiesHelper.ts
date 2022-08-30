import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  ConfirmedSignatureInfo,
  LAMPORTS_PER_SOL,
  ParsedInstruction,
  ParsedTransactionWithMeta,
  SystemInstruction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  ACTIVITY_ACTION_BURN,
  ACTIVITY_ACTION_RECEIVE,
  ACTIVITY_ACTION_SEND,
  ACTIVITY_ACTION_TOPUP,
  TransactionMeta,
  TransactionStatus,
} from "@toruslabs/base-controllers";
import {
  ACTIVITY_ACTION_UNKNOWN,
  BURN_ADDRESS_INC,
  CHAIN_ID_NETWORK_MAP,
  FetchedTransaction,
  SolanaTransactionActivity,
  TokenTransactionData,
  TransactionPayload,
} from "@toruslabs/solana-controllers";
import log from "loglevel";

import { TopupOrderTransaction } from "@/controllers/IActivitiesController";

import { WALLET_SUPPORTED_NETWORKS } from "./const";

const CHAIN_ID_NETWORK_MAP_OBJ: { [key: string]: string } = { ...CHAIN_ID_NETWORK_MAP };

const getSolanaTransactionLink = (blockExplorerUrl: string, signature: string, chainId: string): string => {
  return `${blockExplorerUrl}/tx/${signature}/?cluster=${CHAIN_ID_NETWORK_MAP_OBJ[chainId]}`;
};

export function lamportToSol(lamport: number, fixedDecimals = 4): string {
  return ((lamport / LAMPORTS_PER_SOL) as number).toFixed(fixedDecimals);
}

export function cryptoAmountToUiAmount(amount: number, decimals: number, fixedDecimals = 4): string {
  return ((amount / 10 ** decimals) as number).toFixed(fixedDecimals);
}

// Formatting Parsed Transaction from Blockchain(Solana) to Display Activity format
export const formatTransactionToActivity = (params: {
  transactions: (ParsedTransactionWithMeta | null)[];
  signaturesInfo: ConfirmedSignatureInfo[];
  chainId: string;
  blockExplorerUrl: string;
  selectedAddress: string;
}) => {
  const { transactions, signaturesInfo, chainId, blockExplorerUrl, selectedAddress } = params;
  const finalTxs = signaturesInfo.map((info, index) => {
    const tx = transactions[index];
    const finalObject: SolanaTransactionActivity = {
      slot: info.slot.toString(),
      status: tx?.meta?.err ? TransactionStatus.failed : TransactionStatus.finalized,
      updatedAt: (info.blockTime || 0) * 1000,
      signature: info.signature,
      txReceipt: info.signature,
      blockExplorerUrl: getSolanaTransactionLink(blockExplorerUrl, info.signature, chainId),
      chainId,
      network: CHAIN_ID_NETWORK_MAP_OBJ[chainId],
      rawDate: new Date((info.blockTime || 0) * 1000).toISOString(),
      action: ACTIVITY_ACTION_UNKNOWN,
      type: "unknown",
      decimal: 9,
    };

    // return as unknown transaction if tx/meta is undefined as further decoding require tx.meta
    if (!tx?.meta) return finalObject;

    // TODO: Need to Decode for Token Account Creation and Transfer Instruction which bundle in 1 Transaction.
    let interestedTransactionInstructionidx = -1;
    const instructionLength = tx.transaction.message.instructions.length;

    if (instructionLength > 1 && instructionLength <= 3) {
      const createInstructionIdx = tx.transaction.message.instructions.findIndex((inst) => {
        if (inst.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)) {
          return (inst as unknown as ParsedInstruction).parsed?.type === "create";
        }
        return false;
      });
      if (createInstructionIdx >= 0) {
        const transferIdx = tx.transaction.message.instructions.findIndex((inst) => {
          return ["transfer", "transferChecked"].includes((inst as unknown as ParsedInstruction).parsed?.type);
        });
        interestedTransactionInstructionidx = transferIdx;
      } else {
        const burnIdx = tx.transaction.message.instructions.findIndex((inst) => {
          return ["burn", "burnChecked"].includes((inst as unknown as ParsedInstruction).parsed?.type);
        });
        interestedTransactionInstructionidx = burnIdx;
      }
    }

    const interestedTransactionType = ["transfer", "transferChecked", "burn", "burnChecked"];

    // Expecting SPL/SOL transfer Transaction to have only 1 instruction
    if (tx.transaction.message.instructions.length === 1 || interestedTransactionInstructionidx >= 0) {
      if (tx.transaction.message.instructions.length === 1) interestedTransactionInstructionidx = 0;
      const inst: ParsedInstruction = tx.transaction.message.instructions[interestedTransactionInstructionidx] as unknown as ParsedInstruction;
      if (inst.parsed && interestedTransactionType.includes(inst.parsed.type)) {
        if (inst.program === "spl-token") {
          // set spl-token parameter
          // authority is the signer(sender)
          const source = inst.parsed.info.authority;
          if ((tx?.meta?.postTokenBalances?.length || 0) <= 1) {
            finalObject.from = source;
            finalObject.to = source;
          } else if (tx?.meta?.postTokenBalances) {
            finalObject.from = source;
            finalObject.to = tx.meta.postTokenBalances[0].owner === source ? tx.meta.postTokenBalances[1].owner : tx.meta.postTokenBalances[0].owner;
          }

          let mint = tx?.meta?.postTokenBalances?.length ? tx?.meta?.postTokenBalances[0].mint : "";
          mint = ["burn", "burnChecked"].includes(inst.parsed.type) ? inst.parsed.info.mint : mint;
          // "transferCheck" is parsed differently from "transfer" instruction
          const amount = ["burnChecked", "transferChecked"].includes(inst.parsed.type)
            ? inst.parsed.info.tokenAmount.amount
            : inst.parsed.info.amount;
          const decimals = ["burnChecked", "transferChecked"].includes(inst.parsed.type)
            ? inst.parsed.info.tokenAmount.decimals
            : inst.parsed.info.decimals;
          finalObject.cryptoAmount = amount;
          finalObject.cryptoCurrency = "-";
          finalObject.fee = tx.meta.fee;
          finalObject.type = inst.parsed.type;
          finalObject.send = finalObject.from === selectedAddress;
          finalObject.action = finalObject.send ? ACTIVITY_ACTION_SEND : ACTIVITY_ACTION_RECEIVE;
          finalObject.decimal = decimals;
          finalObject.totalAmountString = cryptoAmountToUiAmount(amount, decimals);
          finalObject.logoURI = "";
          finalObject.mintAddress = mint;
        } else if (inst.program === "system") {
          finalObject.from = inst.parsed.info.source;
          finalObject.to = inst.parsed.info.destination;
          finalObject.cryptoAmount = inst.parsed.info.lamports;
          finalObject.cryptoCurrency = "SOL";
          finalObject.fee = tx.meta.fee;
          finalObject.type = inst.parsed.type;
          finalObject.send = inst.parsed.info.source === selectedAddress;
          finalObject.action = finalObject.send ? ACTIVITY_ACTION_SEND : ACTIVITY_ACTION_RECEIVE;
          finalObject.decimal = 9;
          finalObject.totalAmountString = lamportToSol(inst.parsed.info.lamports);
          // finalObject.logoURI = default sol logo
          // No converstion to current currency rate as the backend use transaction date currency rate
        }
      }
    }
    return finalObject;
  });
  return finalTxs;
};

// Formatting a Transaction (From Transaction Controller) to Display Activity Format
export const formatNewTxToActivity = (
  tx: TransactionMeta<Transaction>,
  currencyData: { selectedCurrency: string; conversionRate: number },
  selectedAddress: string,
  blockExplorerUrl: string,
  tokenTransfer?: TokenTransactionData
): SolanaTransactionActivity => {
  const isoDateString = new Date(tx.time).toISOString();

  // Default display parameter for unknown Transaction
  const finalObject: SolanaTransactionActivity = {
    slot: "n/a",
    status: tx.status as TransactionStatus,
    signature: tx.transactionHash || "",
    updatedAt: tx.time,
    rawDate: isoDateString,
    blockExplorerUrl: getSolanaTransactionLink(blockExplorerUrl, tx.transactionHash || "", tx.chainId),
    network: CHAIN_ID_NETWORK_MAP_OBJ[tx.chainId],
    chainId: tx.chainId,
    action: ACTIVITY_ACTION_UNKNOWN,
    type: "unknown",
    decimal: 9,
    currencyAmount: 0,
    currency: currencyData.selectedCurrency,
    // for Unkown transaction, default "from" as selectedAddress and "to" as arbitrary string
    // Probably will not be used for display (Backend do not accept empty string)
    from: selectedAddress,
    to: "unknown-unknown-unknown-unknown-",
    // fee: tx.,
  };

  // Check for decodable instruction (SOL transfer)
  // Expect SOL transfer to have only 1 instruction in 1 transaction
  if (tx.transaction.instructions.length === 1) {
    const instruction1 = tx.transaction.instructions[0];
    if (SystemProgram.programId.equals(instruction1.programId) && SystemInstruction.decodeInstructionType(instruction1) === "Transfer") {
      const parsedInst = SystemInstruction.decodeTransfer(instruction1);

      finalObject.from = parsedInst.fromPubkey.toBase58();
      finalObject.to = parsedInst.toPubkey.toBase58();
      finalObject.cryptoAmount = Number(parsedInst.lamports);
      finalObject.cryptoCurrency = "SOL";
      finalObject.type = "transfer";
      finalObject.totalAmountString = lamportToSol(Number(parsedInst.lamports));
      finalObject.currency = currencyData.selectedCurrency.toUpperCase();
      finalObject.decimal = 9;
      finalObject.send = selectedAddress === finalObject.from;
      finalObject.action = finalObject.send ? ACTIVITY_ACTION_SEND : ACTIVITY_ACTION_RECEIVE;
      finalObject.currencyAmount = (finalObject.cryptoAmount / LAMPORTS_PER_SOL) * currencyData.conversionRate;
    }
  }

  // Check for if it is SPL Token Transfer (tokenTransfer will be undefined if it is not SPL token transfer)
  // SPL token info is decoded before pass in as tokenTransfer to patchNewTransaction
  if (tokenTransfer) {
    finalObject.from = tokenTransfer.from;
    finalObject.to = tokenTransfer.to;
    finalObject.cryptoAmount = tokenTransfer.amount;
    finalObject.cryptoCurrency = tokenTransfer.tokenName;
    finalObject.type = tokenTransfer?.to === BURN_ADDRESS_INC ? "burn" : "transfer";
    finalObject.decimal = tokenTransfer.decimals;
    finalObject.currency = currencyData.selectedCurrency.toUpperCase();
    finalObject.currencyAmount = Number(cryptoAmountToUiAmount(tokenTransfer.amount, tokenTransfer.decimals)) * currencyData.conversionRate;
    finalObject.totalAmountString =
      tokenTransfer?.to === BURN_ADDRESS_INC
        ? tokenTransfer?.amount.toString()
        : cryptoAmountToUiAmount(tokenTransfer.amount, tokenTransfer.decimals);
    finalObject.logoURI = tokenTransfer.logoURI;
    finalObject.send = selectedAddress === finalObject.from;
    finalObject.action = finalObject.send ? ACTIVITY_ACTION_SEND : ACTIVITY_ACTION_RECEIVE;
    finalObject.mintAddress = tokenTransfer.mintAddress;
  }
  return finalObject;
};

// Formatting Backend data to Display Activity Format
export const formatBackendTxToActivity = (tx: FetchedTransaction, selectedAddress: string): SolanaTransactionActivity => {
  // Default parameter for Unknown Transaction
  const finalObject: SolanaTransactionActivity = {
    action: ACTIVITY_ACTION_UNKNOWN,
    status: tx.status as TransactionStatus,
    id: tx.id,
    from: tx.from,
    to: tx.to,
    rawDate: tx.created_at,
    updatedAt: new Date(tx.created_at).valueOf(),
    blockExplorerUrl: getSolanaTransactionLink(
      WALLET_SUPPORTED_NETWORKS[CHAIN_ID_NETWORK_MAP_OBJ[tx.network]].blockExplorerUrl,
      tx.signature,
      tx.network
    ),
    network: CHAIN_ID_NETWORK_MAP_OBJ[tx.network],
    chainId: tx.network,
    signature: tx.signature,
    fee: parseFloat(tx.fee),
    type: tx.transaction_category.toLowerCase(),
    decimal: 9,
    logoURI: "",
    mintAddress: tx.mint_address || undefined,
    cryptoAmount: 0,
    cryptoCurrency: "sol",
    currencyAmount: 0,
    currency: "usd",
  };
  log.info(selectedAddress);

  // transction_category "transfer" is either SPL or SOL transfer Transaction
  if (["transfer", "burn"].includes(tx.transaction_category.toLowerCase())) {
    finalObject.currencyAmount = parseFloat(tx.currency_amount);
    finalObject.currency = tx.selected_currency;
    finalObject.cryptoAmount = parseInt(tx.crypto_amount, 10);
    finalObject.cryptoCurrency = tx.crypto_currency.toUpperCase();
    finalObject.decimal = tx.decimal;
    finalObject.totalAmountString = cryptoAmountToUiAmount(finalObject.cryptoAmount, finalObject.decimal);
    finalObject.send = selectedAddress === finalObject.from;

    if (tx.transaction_category === "burn") finalObject.action = ACTIVITY_ACTION_BURN;
    else if (finalObject.send) finalObject.action = ACTIVITY_ACTION_SEND;
    else finalObject.action = ACTIVITY_ACTION_RECEIVE;
  }
  return finalObject;
};

// Reclassification of status
export const reclassifyStatus = (status: string): TransactionStatus => {
  if (status === "success") {
    return TransactionStatus.finalized;
  }
  if (status === "failed") {
    return TransactionStatus.failed;
  }
  return TransactionStatus.submitted;
};

// Formatting Backend data to Display Activity Format
export const formatTopUpTxToActivity = (tx: TopupOrderTransaction): SolanaTransactionActivity | undefined => {
  try {
    // Default parameter for Unknown Transaction
    // expect topup happen on mainnet only
    const chainId = "0x1";
    const network = CHAIN_ID_NETWORK_MAP_OBJ[chainId];

    // status reclassification
    const status = reclassifyStatus(tx.status);

    const finalObject: SolanaTransactionActivity = {
      action: ACTIVITY_ACTION_TOPUP,
      status,
      id: Number(tx.id),
      from: tx.from,
      to: tx.to,
      rawDate: tx.date,
      updatedAt: new Date(tx.date).valueOf(),
      blockExplorerUrl: tx.solana?.signature
        ? getSolanaTransactionLink(WALLET_SUPPORTED_NETWORKS[network].blockExplorerUrl, tx.solana.signature, chainId)
        : "",
      network,
      chainId,
      signature: tx.solana.signature || "",
      // fee: parseFloat(tx.solana.fee),
      type: tx.action,
      decimal: tx.solana.decimal === undefined ? 9 : Number(tx.solana.decimal),
      logoURI: "",

      currencyAmount: Number(tx.solana.currencyAmount),
      currency: tx.currencyUsed,
      cryptoAmount: Number(tx.solana.amount), // (tx.solana.decimal === undefined ? 1 : 10 ** Number(tx.solana.decimal)),
      cryptoCurrency: tx.solana.symbol.toUpperCase(),
    };
    finalObject.totalAmountString = (finalObject.cryptoAmount || 0).toString();

    return finalObject;
  } catch (e) {
    log.error(e);
    return undefined;
  }
};

// Formatting Display Activity to Backend Format which will be used to update backend
export const formatTxToBackend = (tx: SolanaTransactionActivity, gaslessRelayer = ""): TransactionPayload => {
  // For Unknown Transaction default cryptoAmount to 0, cryptoCurrency to SOL, transaction category to unknown
  const finalObject: TransactionPayload = {
    from: tx.from,
    to: tx.to,
    crypto_amount: tx.cryptoAmount?.toString() || "0",
    crypto_currency: tx.cryptoCurrency || "SOL",
    decimal: tx.decimal,
    currency_amount: (tx.currencyAmount || 0).toString(),
    selected_currency: (tx.currency || "").toUpperCase(),
    status: tx.status,
    signature: tx.signature,
    fee: tx.fee?.toString() || "n/a",
    network: tx.chainId,
    created_at: tx.rawDate,
    transaction_category: tx.type.toLowerCase(),
    gasless: !!gaslessRelayer,
    gasless_relayer_public_key: gaslessRelayer,
    is_cancel: false,
    mint_address: tx.mintAddress || "",
  };
  return finalObject;
};

export function getChainIdToNetwork(chainId: string): string {
  log.info(CHAIN_ID_NETWORK_MAP_OBJ);
  return CHAIN_ID_NETWORK_MAP_OBJ[chainId];
}
