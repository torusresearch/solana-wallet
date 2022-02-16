import "@/main.css";

import { createApp } from "vue";

import App from "@/App.vue";
import router from "@/router";

import { i18n } from "./plugins/i18nPlugin";
import { installSentry } from "./sentry";
import store from "./store";

const vue = createApp(App);
vue.use(i18n).use(router).use(store).mount("#app");

if (process.env.NODE_ENV !== "development") installSentry(vue);
