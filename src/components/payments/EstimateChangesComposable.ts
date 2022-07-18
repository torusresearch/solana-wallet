import { Connection, Transaction } from "@solana/web3.js";
import log from "loglevel";
import { ref } from "vue";

import { AccountEstimation } from "@/utils/interfaces";
import { getEstimateBalanceChange } from "@/utils/solanaHelpers";

export const useEstimateChanges = () => {
  const hasEstimationError = ref("");
  const estimatedBalanceChange = ref<AccountEstimation[]>([]);
  const estimationInProgress = ref(true);

  const estimateChanges = async (transaction: Transaction, connection: Connection, selectedAddress: string) => {
    try {
      estimationInProgress.value = true;
      estimatedBalanceChange.value = await getEstimateBalanceChange(connection, transaction, selectedAddress);
    } catch (e) {
      hasEstimationError.value = (e as Error).message;
      log.error("estimation error", e);
    }
    estimationInProgress.value = false;
  };

  return { hasEstimationError, estimatedBalanceChange, estimationInProgress, estimateChanges };
};
