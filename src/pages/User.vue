<script lang="ts" setup>
import base58 from "bs58";
import { onMounted } from "vue";
import { useRouter } from "vue-router";

import ControllerModule from "@/modules/controllers";

const router = useRouter();

onMounted(async () => {
  let address = "";
  const param_address = router.currentRoute.value.params.address as string;
  const parsed_address = await ControllerModule.getSNSAddress({
    type: "sns",
    address: param_address,
  });
  if (parsed_address) {
    address = parsed_address;
  } else {
    try {
      const pubKey = base58.decode(param_address); // to check if address is valid pubkey
      if (pubKey.length !== 32) throw new Error(); // to check if address is valid pubkey
      address = param_address;
    } catch (e) {
      return router.push("/");
    }
  }
  await ControllerModule.logout();
  await ControllerModule.initializeWithPubKey(address);
  return router.push("/wallet/home");
});
</script>

<template>
  <div></div>
</template>

<style scoped></style>
