import "@/main.css";

import { createApp } from "vue";

import App from "@/App.vue";
import router from "@/router";

import i18nPlugin from "./plugins/i18nPlugin";
import store from "./store";

createApp(App).use(i18nPlugin).use(router).use(store).mount("#app");
