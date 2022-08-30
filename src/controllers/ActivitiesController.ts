import { PublicKey } from "@solana/web3.js";
import { BaseConfig, BaseController, BaseState, TransactionStatus } from "@toruslabs/base-controllers";
import { NetworkController, PreferencesController, TransactionPayload } from "@toruslabs/solana-controllers";
import log from "loglevel";

import { formatBackendTxToActivity, formatTopUpTxToActivity, formatTransactionToActivity, formatTxToBackend } from "@/utils/activitiesHelper";

import { FetchedTransaction, SolanaTransactionActivity, TopupOrderTransaction } from "./IActivitiesController";

export interface ActivitiesControllerState extends BaseState {
  address: {
    [selectedAddress: string]: {
      topupTransaction: TopupOrderTransaction[];
      backendTransactions: FetchedTransaction[];
      activities: {
        [key: string]: SolanaTransactionActivity;
      };
    };
  };
  state: string;
  loading: boolean;
}
export type ActivitiesControllerConfig = BaseConfig;

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
    if (!this.state.address[selectedAddress].topupTransaction) return tempMap;
    this.state.address[selectedAddress].topupTransaction.forEach((item) => {
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
    if (!this.state.address[selectedAddress].backendTransactions) return tempMap;

    this.state.address[selectedAddress].backendTransactions.forEach((tx) => {
      if (tx.network === this.getProviderConfig().chainId) {
        const temp = formatBackendTxToActivity(tx, selectedAddress);
        if (temp) tempMap.push(temp);
      }
    });
    return tempMap;
  }

  async updateTopUpTransaction(address: string) {
    const response = await this.getTopUpOrders<TopupOrderTransaction>(address);

    this.update({
      address: {
        ...this.state.address,
        [address]: {
          ...this.state.address[address],
          topupTransaction: response,
        },
      },
    });
  }

  async updateBackendTransaction(address: string) {
    const response = await this.getWalletOrders<FetchedTransaction>(address);
    this.update({
      address: {
        ...this.state.address,
        [address]: {
          ...this.state.address[address],
          backendTransactions: response,
        },
      },
    });
  }

  async onChainActivities(): Promise<SolanaTransactionActivity[]> {
    const providerConfig = this.getProviderConfig();
    const selectedAddress = this.getSelectedAddress();
    const connection = this.getConnection();
    let signatureInfo = await connection.getSignaturesForAddress(new PublicKey(selectedAddress), { limit: 40 });

    signatureInfo = signatureInfo.filter((s) => this.state.address[selectedAddress].activities[s.signature]?.status !== TransactionStatus.finalized);
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
    this.update({
      loading: true,
      address: {
        ...this.state.address,
        [this.getSelectedAddress()]: {
          ...this.state.address[this.getSelectedAddress()],
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
    const activities = initialActivities || this.state.address[selectedAddress].activities;

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
      address: {
        ...this.state.address,

        [selectedAddress]: {
          ...(this.state.address[selectedAddress] || {}),
          activities,
        },
      },
      loading: false,
    });
  }

  updateIncomingTransaction(status: TransactionStatus, id: number): void {
    const selectedAddress = this.getSelectedAddress();
    this.patchPastTx({ id: id.toString(), status, updated_at: new Date().toISOString() }, selectedAddress);
    const { backendTransactions } = this.state.address[selectedAddress];
    const idx = backendTransactions.findIndex((item) => item.id === id);
    backendTransactions[idx].status = status;

    this.update({
      address: {
        ...this.state.address,
        [selectedAddress]: {
          ...this.state.address[selectedAddress],
          backendTransactions,
        },
      },
    });
  }

  // When a new Transaction is submitted, append to incoming Transaction and post to backend
  async patchNewTx(formattedTx: SolanaTransactionActivity, address: string): Promise<void> {
    const selectedAddress = this.getSelectedAddress();
    const { backendTransactions, activities } = this.state.address[selectedAddress];

    const duplicateIndex = backendTransactions.findIndex((x) => x.signature === formattedTx.signature);
    if (duplicateIndex === -1 && formattedTx.status === TransactionStatus.submitted) {
      // No duplicate found

      // Update display activites locally (optimistic)
      activities[formattedTx.signature] = formattedTx;
      // incomingBackendTransactions = [...incomingBackendTransactions, formattedTx];

      this.update({
        address: {
          ...this.state.address,
          [selectedAddress]: {
            ...this.state.address[selectedAddress],
            activities,
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
          address: {
            // ...this.state.address,
            [selectedAddress]: {
              ...this.state.address[selectedAddress],
              activities,
            },
          },
        });
      }
    }
  }
}
