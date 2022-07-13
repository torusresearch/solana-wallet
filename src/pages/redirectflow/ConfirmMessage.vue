<script setup lang="ts">
import log from "loglevel";
import { onMounted, reactive, ref } from "vue";

import FullDivLoader from "@/components/FullDivLoader.vue";
import Permissions from "@/components/permissions/Permissions.vue";
import { SignMessageChannelDataType } from "@/utils/enums";

import ControllerModule from "../../modules/controllers";
import { redirectToResult, useRedirectFlow } from "../../utils/redirectflow_helpers";

const { params, method, resolveRoute, jsonrpc, req_id } = useRedirectFlow();
const loading = ref(true);
interface MsgData {
  origin: string;
  data?: Uint8Array;
  message: string;
}
const msg_data = reactive<MsgData>({
  origin: "",
  message: "",
});

onMounted(async () => {
  if (Object.keys(params).length) params.message = Uint8Array.from(Object.values(params?.message));
  let channel_msg: Partial<SignMessageChannelDataType>;
  try {
    if (params?.message)
      channel_msg = {
        data: Buffer.from(params?.message || []).toString("hex"),
        message: Buffer.from(params?.message || []).toString(),
        origin: window.location.origin,
      };
    else {
      redirectToResult(jsonrpc, { message: "Invalid or Missing Params", success: false, method }, req_id, resolveRoute);
      return;
    }

    // TODO: add support to sign array of messages
    msg_data.data = Buffer.from(channel_msg.data as string, "hex");
    msg_data.message = (channel_msg.message as string) || "";
    msg_data.origin = channel_msg.origin as string;
  } catch (error) {
    log.error(error, "error in tx");
  }
  loading.value = false;
});

const approveTxn = async (): Promise<void> => {
  loading.value = true;
  const res = await ControllerModule.torus.signMessage(
    {
      params: {
        data: params.message,
      },
      method: "sign_message",
    },
    true
  );
  redirectToResult(jsonrpc, { data: { signature: Buffer.from(res).toString("hex") }, success: true, method }, req_id, resolveRoute);
};

const rejectTxn = async () => {
  loading.value = true;
  redirectToResult(jsonrpc, { success: false, method }, req_id, resolveRoute);
};
</script>

<template>
  <FullDivLoader v-if="loading" />
  <Permissions v-else :requested-from="msg_data.origin" :approval-message="msg_data.message" @on-approved="approveTxn" @on-rejected="rejectTxn" />
</template>
