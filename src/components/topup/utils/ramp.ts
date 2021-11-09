import { get } from "@toruslabs/http-helpers";
import log from "loglevel";

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
