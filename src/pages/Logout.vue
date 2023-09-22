<script setup lang="ts">
import { onMounted } from "vue";

import ControllerModule from "@/modules/controllers";
import { i18n } from "@/plugins/i18nPlugin";

import { redirectToResult, useRedirectFlow } from "../utils/redirectflowHelpers";

const { isRedirectFlow, method, resolveRoute, req_id, jsonrpc } = useRedirectFlow();

const { t } = i18n.global;

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
