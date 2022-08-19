import assert from "assert";
import sinon from "sinon";

import * as whiteLabel from "@/utils/whitelabel";

describe("whiteLabel", () => {
  const sandbox = sinon.createSandbox({});
  const whiteLabelParams = {
    name: "HelloDemo",
    url: "http://localhost:3000",
    theme: {
      isDark: true,
      colors: {
        torusBrand1: "#2dffb2",
      },
    },
    logoDark: "https://solana-testing.tor.us/img/solana-logo-light.46db0c8f.svg",
    logoLight: "https://solana-testing.tor.us/img/solana-logo-light.46db0c8f.svg",
    topupHide: true,
    defaultLanguage: "ja",
  };
  beforeEach(() => {
    whiteLabel.setWhiteLabel(whiteLabelParams);
  });
  it("getWhiteLabel", () => {
    const result = whiteLabel.getWhiteLabel();
    assert.deepEqual(result, whiteLabelParams);
  });
  it("getWhiteLabel null or error", () => {
    const result = whiteLabel.isWhiteLabelSet();
    assert.deepEqual(result, true);
  });
  it("isWhiteLabelDark", () => {
    const result = whiteLabel.isWhiteLabelDark();
    assert.deepEqual(result, true);
  });
  it("getBrandColor", () => {
    const result = whiteLabel.getBrandColor();
    assert.deepEqual(result, whiteLabelParams.theme.colors.torusBrand1);
  });
  it("isTopupHidden", () => {
    const result = whiteLabel.isTopupHidden();
    assert.deepEqual(result, whiteLabelParams.topupHide);
  });
  it("getWhiteLabelLogoLight", () => {
    const result = whiteLabel.getWhiteLabelLogoLight();
    assert.deepEqual(result, whiteLabelParams.logoLight);
  });
  it("getWhiteLabelLogoDark", () => {
    const result = whiteLabel.getWhiteLabelLogoDark();
    assert.deepEqual(result, whiteLabelParams.logoDark);
  });
  it("getWhiteLabelLogo", () => {
    const result = whiteLabel.getWhiteLabelLogo();
    assert.deepEqual(result, whiteLabelParams.logoDark);
  });
  it("getWhiteLabelLocale", () => {
    const result = whiteLabel.getWhiteLabelLocale();
    assert.deepEqual(result, whiteLabelParams.defaultLanguage);
  });
  it("getWhiteLabelAppName", () => {
    const result = whiteLabel.getWhiteLabelAppName();
    assert.deepEqual(result, whiteLabelParams.name);
  });
  it("getWhiteLabelAppUrl", () => {
    const result = whiteLabel.getWhiteLabelAppUrl();
    assert.deepEqual(result, whiteLabelParams.url);
  });
  it("applyWhiteLabelColors", () => {
    const setPropertySpy = sandbox.spy(document.documentElement.style, "setProperty");
    whiteLabel.applyWhiteLabelColors();
    assert(setPropertySpy.called);
  });
});
