import * as Sentry from "@sentry/vue";
import { VueI18nTranslation } from "vue-i18n";

import { addToast, removeToast } from "@/modules/app";
import { i18n } from "@/plugins/i18nPlugin";

export function handleExceptions(e: any): void {
  const t = i18n.global.t as VueI18nTranslation;
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
