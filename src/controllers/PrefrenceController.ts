import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ComputeBudgetProgram, ConfirmedSignatureInfo, ParsedInstruction, ParsedTransactionWithMeta, PublicKey } from "@solana/web3.js";
import { ACTIVITY_ACTION_RECEIVE, ACTIVITY_ACTION_SEND, PreferencesState, TransactionStatus } from "@toruslabs/base-controllers";
import {
  ACTIVITY_ACTION_UNKNOWN,
  cryptoAmountToUiAmount,
  CurrencyController,
  ExtendedAddressPreferences,
  getChainIdToNetwork,
  KeyringController,
  lamportToSol,
  NetworkController,
  PreferencesController,
  SolanaPreferencesConfig,
  SolanaTransactionActivity,
} from "@toruslabs/solana-controllers";

const getSolanaTransactionLink = (blockExplorerUrl: string, signature: string, chainId: any): string => {
  return `${blockExplorerUrl}/tx/${signature}/?cluster=${getChainIdToNetwork(chainId)}`;
};

// Formatting Parsed Transaction from Blockchain(Solana) to Display Activity format
export const formatTransactionToActivity = (params: {
  transactions: ParsedTransactionWithMeta[];
  signaturesInfo: ConfirmedSignatureInfo[];
  chainId: string;
  blockExplorerUrl: string;
  selectedAddress: string;
}) => {
  const { transactions, signaturesInfo, chainId, blockExplorerUrl, selectedAddress } = params;
  const finalTxs = signaturesInfo.map((info, index) => {
    const tx = transactions[index];
    const blockTime = info.blockTime ?? 0;
    const finalObject: SolanaTransactionActivity = {
      slot: info.slot.toString(),
      status: tx?.meta?.err ? TransactionStatus.failed : TransactionStatus.confirmed,
      updatedAt: blockTime * 1000,
      signature: info.signature,
      txReceipt: info.signature,
      blockExplorerUrl: getSolanaTransactionLink(blockExplorerUrl, info.signature, chainId),
      chainId,
      network: getChainIdToNetwork(chainId),
      rawDate: new Date(blockTime * 1000).toISOString(),
      action: ACTIVITY_ACTION_UNKNOWN,
      type: "unknown",
      decimal: 9,
    };

    // return as unknown transaction if tx/meta is undefined as further decoding require tx.meta
    if (!tx?.meta) return finalObject;

    // TODO: Need to Decode for Token Account Creation and Transfer Instruction which bundle in 1 Transaction.
    let interestedTransactionInstructionidx = -1;
    let instructionLength = tx.transaction.message.instructions.length;

    let computeBudgetAdjusted = 0;
    if (instructionLength >= 3) {
      if (ComputeBudgetProgram.programId.equals(tx.transaction.message.instructions[0].programId)) {
        instructionLength -= 1;
        computeBudgetAdjusted += 1;
      }
      if (ComputeBudgetProgram.programId.equals(tx.transaction.message.instructions[1].programId)) {
        instructionLength -= 1;
        computeBudgetAdjusted += 1;
      }
    }

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
    if (instructionLength === 1 || interestedTransactionInstructionidx >= 0) {
      if (instructionLength === 1) interestedTransactionInstructionidx = computeBudgetAdjusted;
      const inst: ParsedInstruction = tx.transaction.message.instructions[interestedTransactionInstructionidx] as unknown as ParsedInstruction;
      if (inst.parsed && interestedTransactionType.includes(inst.parsed.type)) {
        if (inst.program === "spl-token") {
          // set spl-token parameter
          // authority is the signer(sender)
          const source = inst.parsed.info.authority;
          const postTokenBalances = tx.meta.postTokenBalances ?? [];
          if (postTokenBalances.length <= 1) {
            finalObject.from = source;
            finalObject.to = source;
          } else {
            finalObject.from = source;
            finalObject.to = postTokenBalances[0]?.owner === source ? postTokenBalances[1]?.owner : postTokenBalances[0]?.owner;
          }

          const { mint } = ["burn", "burnChecked"].includes(inst.parsed.type) ? inst.parsed.info : postTokenBalances[0];
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

export class ModPrefrenceController extends PreferencesController {
  private getOverrideProviderConfig: NetworkController["getProviderConfig"];

  private getOverrideConnection: NetworkController["getConnection"];

  /**
   * Creates a PreferencesController instance
   *
   * @param config - Initial options used to configure this controller
   * @param state - Initial state to set on this controller
   */
  constructor(args: {
    config?: SolanaPreferencesConfig;
    state?: Partial<PreferencesState<ExtendedAddressPreferences>>;
    signAuthMessage: KeyringController["signAuthMessage"];
    getProviderConfig: NetworkController["getProviderConfig"];
    getCurrentCurrency: CurrencyController["getCurrentCurrency"];
    getConversionRate: CurrencyController["getConversionRate"];
    getConnection: NetworkController["getConnection"];
  }) {
    super(args);
    this.getOverrideProviderConfig = args.getProviderConfig;
    this.getOverrideConnection = args.getConnection;
  }

  // Update with latest data from blockchain
  async updateDisplayActivities(newActivities?: { [keyof: string]: SolanaTransactionActivity }): Promise<SolanaTransactionActivity[]> {
    const address = this.state.selectedAddress;
    const { chainId, blockExplorerUrl } = this.getOverrideProviderConfig();
    const connection = this.getOverrideConnection();

    // Get latest signature from blockchain for main Account
    const signatureInfo = await connection.getSignaturesForAddress(new PublicKey(address), { limit: this.config.TX_LIMIT || 40 });

    // Filter out local's signature that is confirmed
    const displayActivities: { [keyof: string]: SolanaTransactionActivity } = newActivities || this.getAddressState(address)?.displayActivities || {};
    const filteredSignaturesInfo = signatureInfo.filter((info) => {
      const activity = displayActivities[info.signature];
      if (activity) {
        return activity.status !== TransactionStatus.confirmed;
      }
      return true;
    });

    // get parsed comfirmed transactions and format it to local activity display
    const incomingBlockchainTransactions: ParsedTransactionWithMeta[] = [];
    if (filteredSignaturesInfo.length > 0) {
      const localincomingBlockchainTransactions = (
        await connection.getParsedTransactions(
          filteredSignaturesInfo.map((s) => s.signature),
          { maxSupportedTransactionVersion: 0 }
        )
      ).filter((tx) => tx !== null);
      incomingBlockchainTransactions.push(...(localincomingBlockchainTransactions as ParsedTransactionWithMeta[]));
    }

    const incomingBlockchainActivities = formatTransactionToActivity({
      transactions: incomingBlockchainTransactions,
      signaturesInfo: filteredSignaturesInfo,
      chainId,
      blockExplorerUrl,
      selectedAddress: this.state.selectedAddress,
    });

    // patch backend and merge new activities with local's
    incomingBlockchainActivities.forEach((item) => {
      const activity = displayActivities[item.signature];
      // new incoming transaction from blockchain
      if (!activity) {
        displayActivities[item.signature] = item;
      } else if (item.status !== activity.status) {
        activity.status = item.status;
        if (activity.id) {
          this.patchPastTx({ id: activity.id.toString(), status: activity.status, updated_at: new Date().toISOString() }, address);
          this.updateIncomingTransaction(activity.status, activity.id);
        }
      }
    });

    this.updateState({ displayActivities }, address);
    return Object.values(displayActivities);
  }
}
