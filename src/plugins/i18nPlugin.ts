import { createI18n } from "vue-i18n";

import { LOCALE_EN } from "@/utils/enums";
import { getUserLanguage } from "@/utils/helpers";

import locales from "./locales";

export default createI18n({
  legacy: false,
  locale: getUserLanguage() || LOCALE_EN,
  fallbackLocale: LOCALE_EN,
  messages: locales,
  missing: (locale, key) => key,
});
