<script setup lang="ts">
import { UserInfo } from "@toruslabs/base-controllers";
import log from "loglevel";
import { onMounted } from "vue";

import BoxLoader from "@/components/common/BoxLoader.vue";

import ControllersModule from "../modules/controllers";
import { getB64DecodedParams, normalizeJson } from "../utils/helpers";

onMounted(async () => {
  const params = getB64DecodedParams();
  const method = new URLSearchParams(window.location.search).get("method");
  let res: unknown;
  switch (method) {
    case "topup":
      await ControllersModule.torus.handleTopUp(params.params, undefined, true);
      break;
    case "wallet_instance_id":
      res = ControllersModule.torus.getWalletInstanceId(); // send response to deeplink , then close window
      log.info(method, res);
      // setTimeout(window.close,0);
      break;
    case "get_provider_state":
      res = {
        currentLoginProvider: ControllersModule.torus.getAccountPreferences(ControllersModule.torus.selectedAddress)?.userInfo.typeOfLogin || "",
        isLoggedIn: !!ControllersModule.torus.selectedAddress,
      };
      log.info(method, res);
      // setTimeout(window.close,0);
      break;
    case "wallet_get_provider_state":
      res = {
        accounts: ControllersModule.torus.state.KeyringControllerState.wallets.map((e) => e.publicKey),
        chainId: ControllersModule.torus.state.NetworkControllerState.chainId,
        isUnlocked: !!ControllersModule.torus.selectedAddress,
      };
      log.info(method, res);
      // setTimeout(window.close,0);
      break;
    case "user_info":
      res = normalizeJson<UserInfo>(ControllersModule.torus.userInfo); // send response to deeplink, then close window
      log.info(method, res);
      // setTimeout(window.close,0);
      break;
    case "get_gasless_public_key":
      res = ControllersModule.torus.state.RelayMap.torus;
      log.info(method, res);
      // setTimeout(window.close,0);
      break;
    case "getAccounts":
      res = [ControllersModule.torus.state.PreferencesControllerState.selectedAddress];
      log.info(method, res);
      // setTimeout(windo.close,0);
      break;
    case "solana_requestAccounts":
      res = [ControllersModule.torus.state.PreferencesControllerState.selectedAddress];
      log.info(method, res);
      break;
    default:
      setTimeout(window.close, 0);
  }
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex justify-center items-center">
    <BoxLoader />
  </div>
</template>
