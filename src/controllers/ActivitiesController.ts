import { PublicKey } from "@solana/web3.js";
import { BaseConfig, BaseController, TransactionStatus } from "@toruslabs/base-controllers";
import { NetworkController, PreferencesController, TransactionPayload } from "@toruslabs/solana-controllers";
import log from "loglevel";

import { formatBackendTxToActivity, formatTopUpTxToActivity, formatTransactionToActivity, formatTxToBackend } from "@/utils/activitiesHelper";
import { CHAINID } from "@/utils/enums";

import { ActivitiesControllerState, FetchedTransaction, SolanaTransactionActivity, TopupOrderTransaction } from "./IActivitiesController";

export default class ActivitiesController extends BaseController<BaseConfig, ActivitiesControllerState> {
  getProviderConfig: NetworkController["getProviderConfig"];

  getConnection: NetworkController["getConnection"];

  getTopUpOrders: PreferencesController["getTopUpOrders"];

  getWalletOrders: PreferencesController["getWalletOrders"];

  patchPastTx: PreferencesController["patchPastTx"];

  postPastTx: PreferencesController["postPastTx"];

  getSelectedAddress: () => string;

  /**
   * Creates a ActivitiesController instance
   *
   * @param config - Initial options used to configure this controller
   * @param state - Initial state to set on this controller
   */
  constructor({
    config,
    state,
    getProviderConfig,
    getConnection,
    getTopUpOrders,
    patchPastTx,
    postPastTx,
    getSelectedAddress,
    getWalletOrders,
  }: {
    config?: BaseConfig;
    state?: Partial<ActivitiesControllerState>;
    getProviderConfig: NetworkController["getProviderConfig"];
    getConnection: NetworkController["getConnection"];
    getTopUpOrders: PreferencesController["getTopUpOrders"];
    getWalletOrders: PreferencesController["getWalletOrders"];
    patchPastTx: PreferencesController["patchPastTx"];
    postPastTx: PreferencesController["postPastTx"];
    getSelectedAddress: () => string;
  }) {
    log.info(state);
    super({
      config,
      state,
    });
    this.getProviderConfig = getProviderConfig;
    this.getConnection = getConnection;
    this.getSelectedAddress = getSelectedAddress;
    this.getTopUpOrders = getTopUpOrders;
    this.getWalletOrders = getWalletOrders;
    this.patchPastTx = patchPastTx;
    this.postPastTx = postPastTx;
    log.info(this.state);
    this.update({ ...state, loading: false });
  }

  topupActivities(): SolanaTransactionActivity[] {
    const tempMap: SolanaTransactionActivity[] = [];
    const selectedAddress = this.getSelectedAddress();
    if (this.getProviderConfig().chainId !== CHAINID.MAINNET) return [];
    if (!this.state.accounts[selectedAddress].topupTransaction) return tempMap;
    this.state.accounts[selectedAddress].topupTransaction.forEach((item) => {
      if (item?.solana?.signature) {
        const temp = formatTopUpTxToActivity(item);
        if (temp) tempMap.push(temp);
      }
    });
    return tempMap;
  }

  backendActivities(): SolanaTransactionActivity[] {
    const tempMap: SolanaTransactionActivity[] = [];
    const selectedAddress = this.getSelectedAddress();
    if (!this.state.accounts[selectedAddress].backendTransactions) return tempMap;

    this.state.accounts[selectedAddress].backendTransactions.forEach((tx) => {
      if (tx.network === this.getProviderConfig().chainId) {
        const temp = formatBackendTxToActivity(tx, selectedAddress);
        if (temp) tempMap.push(temp);
      }
    });
    return tempMap;
  }

  async updateTopUpTransaction(address: string) {
    let response;
    try {
      response = await this.getTopUpOrders<TopupOrderTransaction>(address);
    } catch (e) {
      log.error(e);
    }
    const account = this.state.accounts[address];
    this.update({
      accounts: {
        ...this.state.accounts,
        [address]: {
          ...account,
          topupTransaction: response || [],
        },
      },
    });
  }

  async updateBackendTransaction(address: string) {
    let response;
    try {
      response = await this.getWalletOrders<FetchedTransaction>(address);
    } catch (e) {
      log.error(e);
    }
    const account = this.state.accounts[address];
    this.update({
      accounts: {
        ...this.state.accounts,
        [address]: {
          ...account,
          backendTransactions: response || [],
        },
      },
    });
  }

  async onChainActivities(): Promise<SolanaTransactionActivity[]> {
    const providerConfig = this.getProviderConfig();
    const selectedAddress = this.getSelectedAddress();
    const connection = this.getConnection();
    let signatureInfo = await connection.getSignaturesForAddress(new PublicKey(selectedAddress), { limit: 40 });

    signatureInfo = signatureInfo.filter(
      (item) => this.state.accounts[selectedAddress].activities[item.signature]?.status !== TransactionStatus.finalized
    );
    if (!signatureInfo.length) {
      // this.updateState({ newTransaction: [] }, address);
      return [];
    }

    const onChainTransactions = await connection.getParsedTransactions(signatureInfo.map((s) => s.signature));

    const temp = formatTransactionToActivity({
      transactions: onChainTransactions,
      signaturesInfo: signatureInfo,
      chainId: providerConfig.chainId,
      blockExplorerUrl: providerConfig.blockExplorerUrl,
      selectedAddress,
    });
    return temp;
  }

  async fullRefresh() {
    const selectedAddress = this.getSelectedAddress();
    this.update({
      loading: true,
      accounts: {
        ...this.state.accounts,
        [selectedAddress]: {
          ...this.state.accounts[selectedAddress],
          activities: {},
        },
      },
    });
    log.info("fullRefresh");
    const initial: { [key: string]: SolanaTransactionActivity } = {};
    [...this.backendActivities(), ...this.topupActivities()].forEach((item) => {
      initial[item.signature] = item;
    });
    this.refreshActivities(initial);
  }

  async refreshActivities(initialActivities?: { [key: string]: SolanaTransactionActivity }): Promise<void> {
    if (this.state.loading && !initialActivities) return;
    this.update({ loading: true });

    log.info("refreshing");
    const selectedAddress = this.getSelectedAddress();
    const activities = initialActivities || this.state.accounts[selectedAddress].activities;

    const newActvities: SolanaTransactionActivity[] = await this.onChainActivities();

    log.info(newActvities);
    newActvities.forEach((item) => {
      const activity = activities[item.signature];
      // new incoming transaction from blockchain
      if (!activity) {
        activities[item.signature] = item;
      } else if (item.status !== activity.status) {
        activity.status = item.status;
        if (activity.id) {
          this.updateIncomingTransaction(activity.status, activity.id);
        }
      }
    });

    this.update({
      accounts: {
        ...this.state.accounts,

        [selectedAddress]: {
          ...this.state.accounts[selectedAddress],
          activities,
        },
      },
      loading: false,
    });
  }

  updateIncomingTransaction(status: TransactionStatus, id: number): void {
    const selectedAddress = this.getSelectedAddress();
    this.patchPastTx({ id: id.toString(), status, updated_at: new Date().toISOString() }, selectedAddress);
    const { backendTransactions } = this.state.accounts[selectedAddress];
    const idx = backendTransactions.findIndex((item) => item.id === id);
    backendTransactions[idx].status = status;

    this.update({
      accounts: {
        ...this.state.accounts,
        [selectedAddress]: {
          ...this.state.accounts[selectedAddress],
          backendTransactions,
        },
      },
    });
  }

  // When a new Transaction is submitted, append to incoming Transaction and post to backend
  async patchNewTx(formattedTx: SolanaTransactionActivity, address: string): Promise<void> {
    const selectedAddress = this.getSelectedAddress();
    const { backendTransactions, activities } = this.state.accounts[selectedAddress];

    const duplicateIndex = backendTransactions.findIndex((x) => x.signature === formattedTx.signature);
    if (duplicateIndex === -1 && formattedTx.status === TransactionStatus.submitted) {
      // No duplicate found

      // Update display activites locally (optimistic)
      activities[formattedTx.signature] = formattedTx;
      // incomingBackendTransactions = [...incomingBackendTransactions, formattedTx];

      this.update({
        accounts: {
          ...this.state.accounts,
          [selectedAddress]: {
            ...this.state.accounts[selectedAddress],
            ...activities,
          },
        },
      });

      // Updated torus backend
      const txFormattedToBackend = formatTxToBackend(formattedTx, "");
      const { response } = await this.postPastTx<TransactionPayload>(txFormattedToBackend, address);

      // Update local transactions with backendId
      const idx = backendTransactions.findIndex((item) => item.signature === formattedTx.signature); // && item.chainId === formattedTx.chainId);
      if (idx >= 0) {
        activities[formattedTx.signature].id = response[0] || -1;
        backendTransactions[idx].id = response[0] || -1;
        this.update({
          accounts: {
            // ...this.state.address,
            [selectedAddress]: {
              ...this.state.accounts[selectedAddress],
              activities,
            },
          },
        });
      }
    }
  }
}
