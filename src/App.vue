<script setup lang="ts">
import log from "loglevel";
import { onBeforeMount } from "vue";

import { Toast } from "@/components/common";

import OpenLoginFactory from "./auth/OpenLogin";
import ControllerModule, { torus } from "./modules/controllers";
import { hideCrispButton, isMain } from "./utils/helpers";

onBeforeMount(async () => {
  if (isMain) {
    const openloginInstance = await OpenLoginFactory.getInstance(true);
    ControllerModule.init({ origin: window.location.origin });

    const result = await OpenLoginFactory.computeAccount().catch((err) => {
      log.error(err);
      return null;
    });

    // rehydration
    if (result?.accounts.length) {
      const userDapp = new Map();
      const addAccountPromises = result.accounts.map(async (account) => {
        userDapp.set(account.address, account.app);

        const address = await torus.addAccount(
          account.solanaPrivKey,
          {
            email: "",
            name: "",
            profileImage: "",
            ...openloginInstance.getUserInfo(),
          },
          true
        );
        return address;
      });
      torus.update({
        UserDapp: userDapp,
      });
      // await Promise.all(addAccountPromises);
      const address = await addAccountPromises[result.matchedDappHost];
      await ControllerModule.setSelectedAccount(address);
    }
  }

  // hide crispbutton on inital load
  hideCrispButton();
});
</script>

<template>
  <div :class="{ dark: ControllerModule.isDarkMode }" class="height-full font-body">
    <router-view />
    <Toast />
  </div>
</template>
