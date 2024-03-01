/* eslint-disable no-param-reassign */
import * as Sentry from "@sentry/vue";
import log from "loglevel";
import { nextTick } from "vue";
import { Composer, createI18n, I18n, VueI18n } from "vue-i18n";

import { LOCALE_EN } from "@/utils/enums";
import { getUserLanguage } from "@/utils/helpers";

export const localeTarget = getUserLanguage() || LOCALE_EN;
export const languageMap: Record<string, string> = {
  en: "english",
  de: "german",
  ja: "japanese",
  ko: "korean",
  zh: "mandarin",
  es: "spanish",
};

export function setI18nLanguage(i18n: I18n, locale: string) {
  if (i18n.mode === "legacy") {
    (i18n.global as unknown as VueI18n).locale = locale;
  } else {
    (i18n.global as unknown as Composer).locale.value = locale;
  }
}

export function setupI18n(locale = LOCALE_EN) {
  const i18n = createI18n({
    locale,
    fallbackLocale: locale,
    legacy: false,
    allowComposition: true,
  }) as I18n;
  setI18nLanguage(i18n, locale);
  return i18n;
}

export async function loadLocaleMessages(i18n: I18n, locale: string) {
  let lang = locale;
  if (!languageMap[lang]) {
    lang = "en";
  }
  try {
    // load locale messages with dynamic import
    const messages = await import(/* webpackChunkName: "locale-[request]" */ `./i18n/${languageMap[lang]}.json`);
    // set locale and locale message
    i18n.global.setLocaleMessage(lang, messages.default);
  } catch (e) {
    log.error(e, `REQUESTED UNKNOWN LOCALE ${lang}`);
    Sentry.setTag("unknown-locale", lang);
  }
  return nextTick();
}

export const setLocale = async (i18n: I18n, lang: string) => {
  let finalLang = lang;

  // if unknown locale is requested, default to en.
  if (!languageMap[lang]) {
    finalLang = "en";
  }

  // load locale messages
  if (!i18n.global.availableLocales.includes(finalLang)) {
    await loadLocaleMessages(i18n, finalLang);
  }
  // set i18n language
  setI18nLanguage(i18n, finalLang);
};

export const i18n = setupI18n(localeTarget);
loadLocaleMessages(i18n, localeTarget);
