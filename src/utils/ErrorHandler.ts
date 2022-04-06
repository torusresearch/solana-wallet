import * as Sentry from "@sentry/vue";

import { addToast, removeToast } from "@/modules/app";
import ControllerModule from "@/modules/controllers";
import { i18n } from "@/plugins/i18nPlugin";

const { t } = i18n.global;
export function handleExceptions(e: any): void {
  const error = e.exception?.values?.[0]?.value;
  if (error?.includes("Network request failed") || error?.includes("Too many requests")) {
    // subsequent error which are not network errors will have the tag that there was a rpc error in the past for this session.
    // which might be a possible explanation of error in inspection
    Sentry.setTag("rpc-error", Date.now());
    const rpcNetworkError: any = { type: "warning", message: t("walletSettings.changeNetworkError") };
    removeToast(rpcNetworkError); // remove existing rpcNetworkError toasts
    addToast(rpcNetworkError); // show rpcNetworkError
    ControllerModule.recordRpcError();
  }
  // handle other uncaught exceptions here
}
