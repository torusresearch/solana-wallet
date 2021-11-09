import { get } from "@toruslabs/http-helpers";
import log from "loglevel";

import { PopupHandler } from "@/handlers/popup/popup-handler";
import { addToast } from "@/modules/app";
import ControllerModule from "@/modules/controllers";

import config from "../../../config";

export async function getQuote(payload: { ramp_symbol?: any }): Promise<{
  feeRate: number;
  rate: number;
  decimals: number;
}> {
  let response: any;
  try {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    response = get(`${config.rampApiQuoteHost}`, options);
  } catch (error) {
    log.error(error);
    throw error;
  }
  const asset = (await response).assets.find((item: any) => item.symbol === payload.ramp_symbol); // the ramp asset object
  const rate = asset.price;
  const feeRate = asset.maxFeePercent;
  return { feeRate, rate, decimals: asset.decimals };
}

export function fetchRampNetworkOrder(currentOrder: { cryptoCurrencySymbol: any; cryptoCurrencyValue: any }, preopenInstanceId?: any) {
  const parameters = {
    userAddress: ControllerModule.torusState.PreferencesControllerState.selectedAddress || undefined,
    userEmailAddress: ControllerModule.torus?.userInfo?.email || undefined,
    swapAsset: currentOrder.cryptoCurrencySymbol || undefined,
    swapAmount: currentOrder.cryptoCurrencyValue || undefined,
    variant: "hosted-auto",
    webhookStatusUrl: `${config.rampApiHost}/transaction`,
    hostUrl: "*",
    hostLogoUrl: "https://app.tor.us/images/torus-logo-blue.svg",
    hostAppName: "Torus",
    hostApiKey: config.rampAPIKEY,
  };
  openWidget(config.rampHost, parameters, preopenInstanceId);
}

export function openWidget(
  path: any,
  params: {
    userAddress: any;
    swapAsset: any;
    swapAmount: any;
    hostLogoUrl: string;
    webhookStatusUrl: string;
    variant: string;
    userEmailAddress: string | undefined;
    hostUrl: string;
    hostAppName: string;
    hostApiKey: string;
  },
  preopenInstanceId: any
) {
  return new Promise((resolve, reject) => {
    const parameterString = new URLSearchParams(JSON.parse(JSON.stringify(params)));
    const finalUrl = `${path}?${parameterString.toString()}`;
    const rampInstantWindow = new PopupHandler(finalUrl, preopenInstanceId);
    let purchaseCreated = false;
    let purchaseSuccess = false;

    // Handle communication with Ramp Instant Widget window
    window.addEventListener(
      "message",
      (event) => {
        if (event.data.type === "PURCHASE_CREATED") {
          purchaseCreated = true;
        } else if (event.data.type === "PURCHASE_SUCCESSFUL") {
          addToast({ message: "Purchase Successful.", type: "success" });
          purchaseSuccess = true;
          resolve({ success: true });
        } else if (event.data.type === "WIDGET_CLOSE") {
          if (purchaseSuccess) {
            // Do nothing, promise already resolved
          } else if (purchaseCreated) {
            resolve({ success: true });
          } else {
            reject(new Error("Purchase Cancelled"));
          }
          rampInstantWindow.close();
        }
      },
      rampInstantWindow.window
    );

    rampInstantWindow.open();
    rampInstantWindow.once("close", () => {
      if (!purchaseSuccess) {
        addToast({ message: "Transaction could not be completed.", type: "error" });
      }
      reject(new Error("User closed Ramp Instant Widget"));
    });
  });
}
