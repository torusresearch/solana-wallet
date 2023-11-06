<script setup lang="ts">
import { Keypair } from "@solana/web3.js";
import base58 from "bs58";
import { onBeforeMount } from "vue";

import { Toast } from "@/components/common";

import OpenLoginHandler from "./auth/OpenLoginHandler";
import ControllerModule, { torus } from "./modules/controllers";
import { hideCrispButton, isMain } from "./utils/helpers";

onBeforeMount(async () => {
  if (isMain) {
    const openloginInstance = await OpenLoginHandler.getInstance(true);
    ControllerModule.init({ origin: window.location.origin });
    if (openloginInstance.privKey) {
      const address = await torus.addAccount(
        base58.encode(Keypair.fromSecretKey(Buffer.from(openloginInstance.ed25519PrivKey, "hex")).secretKey),
        {
          email: "",
          name: "",
          profileImage: "",
          ...openloginInstance.getUserInfo(),
        },
        true
      );
      torus.setSelectedAccount(address);
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
