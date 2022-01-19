<script setup lang="ts">
import { BroadcastChannel } from "broadcast-channel";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";

import ControllerModule from "../modules/controllers";
import { redirectToResult, useRedirectFlow } from "../utils/redirectflow_helpers";

const { isRedirectFlow, method, resolveRoute } = useRedirectFlow();

const { t } = useI18n();

onMounted(async () => {
  const bc = new BroadcastChannel("LOGOUT_WINDOWS_CHANNEL");
  bc.postMessage("logout");
  await ControllerModule.logout();
  if (isRedirectFlow) {
    redirectToResult(method, { success: true }, resolveRoute);
  }
});
</script>

<template>
  <div>{{ t("accountMenu.logOut") }}</div>
</template>
