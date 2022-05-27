import color from "color";

import { NAVIGATION_LIST } from "@/utils/enums";

const lighten = (target: string, val: number) => color(target).lighten(val).rgb().string();

const darken = (target: string, val: number) => color(target).darken(val).rgb().string();

let wasThemeChanged = false;
export function overrideTheme() {
  wasThemeChanged = true;
}
export function didOverrideTheme(): boolean {
  return !!wasThemeChanged;
}

export function getWhiteLabel(): any {
  try {
    if (sessionStorage.getItem("whiteLabel")) {
      return JSON.parse(sessionStorage.getItem("whiteLabel") || "");
    }
    return {};
  } catch (e) {
    return {};
  }
}
export function isWhiteLabelActive(): boolean {
  return Object.keys(getWhiteLabel()).length > 0;
}

export function isWhiteLabelDark() {
  const wl2 = getWhiteLabel();
  return !(wl2?.theme?.isDark === false);
}
export function getBrandColor(): string {
  return getWhiteLabel()?.theme?.colors?.torusBrand1;
}

export function isTopupHidden(): boolean {
  return !!getWhiteLabel()?.topupHide;
}

// before the dom shows, do the housekeeping.
export function applyWhiteLabelThings() {
  const brandColor = getBrandColor();
  if (brandColor) {
    document.documentElement.style.setProperty("--color-primary-100", lighten(brandColor, 0.8));
    document.documentElement.style.setProperty("--color-primary-200", lighten(brandColor, 0.64));
    document.documentElement.style.setProperty("--color-primary-300", lighten(brandColor, 0.4));
    document.documentElement.style.setProperty("--color-primary-400", lighten(brandColor, 0.24));
    document.documentElement.style.setProperty("--color-primary-500", brandColor);
    document.documentElement.style.setProperty("--color-primary-600", darken(brandColor, 0.24));
    document.documentElement.style.setProperty("--color-primary-700", darken(brandColor, 0.4));
    document.documentElement.style.setProperty("--color-primary-800", darken(brandColor, 0.64));
    document.documentElement.style.setProperty("--color-primary-900", darken(brandColor, 0.8));
  }

  if (isTopupHidden()) {
    delete NAVIGATION_LIST.topup;
  }
}

export function getWhiteLabelLogoLight() {
  return getWhiteLabel()?.logoLight;
}
export function getWhiteLabelLogoDark() {
  return getWhiteLabel()?.logoDark;
}

export function getWhiteLabelLocale(): string {
  return getWhiteLabel()?.defaultLanguage || "en";
}

export function getOverrideTranslations(lang: string): any {
  return getWhiteLabel()?.customTranslations?.[lang] || {};
}

export function getWhiteLabelAppName(): string {
  return getWhiteLabel()?.name || "";
}

export function getWhiteLabelAppUrl(): string {
  return getWhiteLabel()?.url || "";
}

export function setWhiteLabel(whiteLabel: any) {
  sessionStorage.setItem("whiteLabel", JSON.stringify(whiteLabel));
}
