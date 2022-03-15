import "@/main.css";

import log from "loglevel";
import { createApp } from "vue";

import App from "@/App.vue";
import router from "@/router";

import { i18n } from "./plugins/i18nPlugin";
import * as serviceWorker from "./registerServiceWorker";
import { installSentry } from "./sentry";
import store from "./store";

const vue = createApp(App);
vue.use(i18n).use(router).use(store).mount("#app");
installSentry(vue);

serviceWorker.register({
  onUpdate: (registration) => {
    const waitingServiceWorker = registration.waiting;

    if (waitingServiceWorker) {
      waitingServiceWorker.addEventListener("statechange", (event: Event) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (event?.target?.state === "activated") {
          window.location.reload();
        }
      });
      log.info("skipping waiting on register");
      waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
    }
  },
});
