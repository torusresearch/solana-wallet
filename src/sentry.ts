import { Integrations } from "@sentry/browser";
import * as Sentry from "@sentry/vue";
import LoglevelSentryPlugin, { redactBreadcrumbData } from "@toruslabs/loglevel-sentry";
import log from "loglevel";
import { App } from "vue";

import { handleExceptions } from "@/utils/ErrorHandler";

function getSampleRate() {
  try {
    return Number.parseFloat(process.env.VUE_APP_SENTRY_SAMPLE_RATE || "");
  } catch {
    return 0.2;
  }
}

export function installSentry(Vue: App) {
  Sentry.init({
    Vue,
    dsn: process.env.VUE_APP_SENTRY_DSN,
    environment: process.env.VUE_APP_MODE,
    release: `solana-wallet@${process.env.VUE_APP_SOLANA_BUILD_VERSION}`,
    autoSessionTracking: true,
    integrations: [new Integrations.Breadcrumbs({ console: false })],
    sampleRate: getSampleRate(),
    normalizeDepth: 5,
    ignoreErrors: [
      // Happen when user click 'X' on the browser (ref https://forum.sentry.io/t/typeerror-failed-to-fetch-reported-over-and-overe/8447/2)
      "TypeError: Failed to fetch", // All except iOS and Firefox
      "TypeError: cancelled", // iOS
      "TypeError: NetworkError when attempting to fetch resource.", // Firefox
      "Error: user closed popup",
    ],
    beforeBreadcrumb(breadcrumb) {
      // eslint-disable-next-line no-param-reassign
      breadcrumb.data = redactBreadcrumbData(breadcrumb.data);
      return breadcrumb;
    },

    beforeSend(e) {
      // callback to handle exceptions
      handleExceptions(e);

      // if not on dev environment, track all events.
      if (process.env.NODE_ENV !== "development") {
        return e;
      }

      // do not track events on dev environment
      return null;
    },
  });
  // Sentry.setUser({ email: "john.doe@example.com" });

  const plugin = new LoglevelSentryPlugin(Sentry);
  plugin.install(log);
}
