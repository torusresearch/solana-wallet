<script setup lang="ts">
import { onMounted, ref } from "vue";

import Button from "@/components/common/Button.vue";
import { REDIRECT_FLOW_CONFIG } from "@/utils/enums";
import { redirectToResult, useRedirectFlow } from "@/utils/redirectflowHelpers";

const { method, resolveRoute, req_id, jsonrpc } = useRedirectFlow();
const errorText = ref<string>("");
onMounted(() => {
  if (!method && !resolveRoute) errorText.value = "Invalid or Missing Method and ResolveRoute";
  else if (!method) errorText.value = "Invalid or Missing Method";
  else if (!resolveRoute) errorText.value = "Invalid or Missing ResolveRoute";
  else if (!REDIRECT_FLOW_CONFIG[method]) errorText.value = `Invalid Method ${method}`;
});
const closeAndRedirect = () => {
  redirectToResult(jsonrpc, { success: false, message: errorText.value, method }, req_id, resolveRoute);
};
</script>
<template>
  <div class="height-full w-full flex justify-center items-center bg-white dark:bg-app-gray-700">
    <div class="p-10 flex flex-col justify-center items-center bg-white dark:bg-app-gray-700 shadow dark:shadow-dark">
      <span class="text-app-gray-800 dark:text-app-text-dark-400">{{ errorText }}</span>
      <Button class="mt-4" @click="closeAndRedirect" @keydown="closeAndRedirect">Close</Button>
    </div>
  </div>
</template>
