import { addToast, removeToast } from "@/modules/app";
import { i18n } from "@/plugins/i18nPlugin";

const { t } = i18n.global;
export function handleExceptions(e: any): void {
  if (e.exception?.values?.[0]?.value?.includes("Network request failed")) {
    const rpcNetworkError: any = { type: "warning", message: t("walletSettings.changeNetworkError") };
    removeToast(rpcNetworkError); // remove existing rpcNetworkError toasts
    addToast(rpcNetworkError); // show rpcNetworkError
  }
  // handle other uncaught exceptions here
}
