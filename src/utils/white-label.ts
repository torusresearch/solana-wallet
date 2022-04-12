import { NAVIGATION_LIST } from "@/utils/enums";

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
  return !!Object.keys(getWhiteLabel());
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
    // change the primary color
    const style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = `.wl-color { color: ${brandColor} !important} 
    .wl-background { background-color: ${brandColor} !important} 
    .wl-background:hover { background-color: ${brandColor}cc !important}
    .wl-border-color { border-color: ${brandColor}}
    .wl-background-no-hover { background-color: ${brandColor} !important};`;
    document.getElementsByTagName("head")[0].appendChild(style);
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

export function setWhiteLabel(whiteLabel: any) {
  sessionStorage.setItem("whiteLabel", JSON.stringify(whiteLabel));
}
