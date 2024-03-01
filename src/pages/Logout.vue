<script setup lang="ts">
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";

import ControllerModule from "@/modules/controllers";

import { redirectToResult, useRedirectFlow } from "../utils/redirectflowHelpers";

const { isRedirectFlow, method, resolveRoute, req_id, jsonrpc } = useRedirectFlow();

const { t } = useI18n();

onMounted(async () => {
  await ControllerModule.logout();
  if (isRedirectFlow) {
    redirectToResult(jsonrpc, { success: true, method }, req_id, resolveRoute);
  }
});
</script>

<template>
  <div>{{ t("accountMenu.logOut") }}</div>
</template>
