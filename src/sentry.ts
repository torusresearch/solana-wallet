/* eslint-disable simple-import-sort/imports */
// Disable ESLint import sorting because '@sentry' require 'vue' and 'browser' packages to be imported before 'tracking' package
import * as Sentry from "@sentry/vue";
import { Integrations as BrowserIntegrations } from "@sentry/browser";
import { BrowserTracing } from "@sentry/tracing";
import LoglevelSentryPlugin, { redactBreadcrumbData } from "@toruslabs/loglevel-sentry";
import log from "loglevel";
import { App } from "vue";
import { handleExceptions } from "@/utils/errorHandlers";
import config from "./config";

const logger = log.getLogger("error");

function getSampleRate() {
  try {
    return Number.parseFloat(process.env.VUE_APP_SENTRY_SAMPLE_RATE || "") || 0.1;
  } catch {
    return 0.1;
  }
}

function getTracesSampleRate() {
  try {
    return Number.parseFloat(process.env.VUE_APP_SENTRY_SAMPLE_RATE || "") || 0.01;
  } catch {
    return 0.01;
  }
}

export function installSentry(Vue: App) {
  if (!process.env.VUE_APP_SENTRY_DSN) return;

  Sentry.init({
    Vue,
    dsn: process.env.VUE_APP_SENTRY_DSN,
    environment: process.env.VUE_APP_MODE,
    release: `solana-wallet@${process.env.VUE_APP_SOLANA_BUILD_VERSION}`,
    autoSessionTracking: true,
    integrations: [
      new BrowserIntegrations.Breadcrumbs({ console: false }),
      new BrowserTracing({
        tracingOrigins: [config.api, config.metadataHost, config.commonApiHost, config.openloginStateAPI],
      }),
    ],
    tracesSampleRate: getTracesSampleRate(),
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
  Sentry.setTag("referrer", document.referrer || "self");
  plugin.install(logger);
}
