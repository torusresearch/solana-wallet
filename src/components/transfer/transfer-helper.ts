import { PublicKey } from "@solana/web3.js";
import memoize from "lodash/memoize";

import ControllerModule from "@/modules/controllers";

export const isOwnerEscrow = memoize(async (domainOwner: string): Promise<boolean> => {
  const NAME_AUCTIONING = new PublicKey("jCebN34bUfdeUYJT13J1yG16XWQpt5PDx6Mse9GUqhR");
  const NAME_OFFERS_ID = new PublicKey("85iDfUvr3HJyLM2zcq5BXSiDvUWfw6cSE1FfNBo8Ap29");
  const accountInfo = await ControllerModule.connection.getAccountInfo(new PublicKey(domainOwner));
  return !!accountInfo?.owner.equals(NAME_OFFERS_ID) || !!accountInfo?.owner.equals(NAME_AUCTIONING);
});

export const addressPromise = memoize(
  (type: string, address: string) => {
    return ControllerModule.getSNSAddress({
      type,
      address,
    });
  },
  (...args) => Object.values(args).join("_")
);
