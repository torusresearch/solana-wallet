<script setup lang="ts">
import { Dialog, DialogOverlay, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { ref } from "vue";

import Qrcode from "./Qrcode.vue";

withDefaults(
  defineProps<{
    isOpen?: boolean;
    publicAddress: string;
    description?: string;
  }>(),
  {
    isOpen: false,
    description: "",
  }
);
const emits = defineEmits(["onClose"]);

const closeModal = () => {
  emits("onClose");
};

const refDiv = ref(null);
</script>
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog :open="isOpen" :initial-focus="refDiv" as="div" @close="closeModal">
      <div ref="refDiv" class="fixed inset-0 z-30 overflow-y-auto">
        <div class="min-h-screen px-4 text-center">
          <DialogOverlay class="fixed inset-0 opacity-30 bg-gray-200 dark:bg-gray-500" />

          <span class="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <div class="relative inline-block w-full md:w-96 align-middle transition-all bg-white dark:bg-app-gray-700 rounded-md">
              <Qrcode :text="publicAddress" :csize="256" />
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
