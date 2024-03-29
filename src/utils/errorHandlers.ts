import * as Sentry from "@sentry/vue";
import { useI18n } from "vue-i18n";

import { addToast, removeToast } from "@/modules/app";

export function handleExceptions(e: any): void {
  const { t } = useI18n();
  if (e.exception?.values?.[0]?.value?.includes("Network request failed")) {
    // subsequent error which are not network errors will have the tag that there was a rpc error in the past for this session.
    // which might be a possible explanation of error in inspection
    Sentry.setTag("rpc-error", Date.now());
    const rpcNetworkError: any = { type: "warning", message: t("walletSettings.changeNetworkError") };
    removeToast(rpcNetworkError); // remove existing rpcNetworkError toasts
    addToast(rpcNetworkError); // show rpcNetworkError
  }
  // handle other uncaught exceptions here
}
