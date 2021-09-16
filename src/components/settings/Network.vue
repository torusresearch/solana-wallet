<script setup lang="ts">
import { SUPPORTED_NETWORKS } from "@toruslabs/casper-controllers";
import log from "loglevel";

import { SelectField } from "@/components/common";

import ControllerModule from "../../modules/controllers";

type SUPPORTED_NETWORK_TYPE = keyof typeof SUPPORTED_NETWORKS;

const networks = Object.keys(SUPPORTED_NETWORKS).map((x) => {
  const current = SUPPORTED_NETWORKS[x as SUPPORTED_NETWORK_TYPE];
  return {
    label: current.displayName,
    value: current.chainId,
  };
});

const selectedNetwork = ControllerModule.torusState.NetworkControllerState.chainId;
// TODO: if chainId is "loading", show a loader

const onNetworkChange = (value: string) => {
  log.info("changing network to", value);
  ControllerModule.setNetwork(value);
};
</script>
<template>
  <div class="pb-4">
    <div class="mb-4">
      <SelectField label="Select Network" :items="networks" :value="selectedNetwork" @change="onNetworkChange" />
    </div>
  </div>
</template>
