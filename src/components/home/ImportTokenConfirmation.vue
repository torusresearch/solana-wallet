<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { ref } from "vue";

import { Button } from "@/components/common";
import ControllerModule from "@/modules/controllers";

const emits = defineEmits(["importConfirm", "importCanceled", "onCloseModal"]);

const closeModal = () => {
  emits("onCloseModal");
};

const onCancel = () => {
  emits("importCanceled");
};

const onImport = async () => {
  emits("importConfirm");
};

const refDiv = ref(null);
</script>
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog :open="isOpen" :class="{ dark: ControllerModule.isDarkMode }" as="div" :initial-focus="refDiv" @close="closeModal">
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
            <div
              class="relative inline-block w-full max-w-sm my-8 overflow-hidden text-left align-middle transition-all bg-white dark:bg-app-gray-700 shadow-xl rounded-md px-4"
            >
              <DialogTitle as="div" class="shadow dark:shadow-dark text-center py-6 w-full">
                <p class="font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500">Confirm Import Token</p>
              </DialogTitle>
              <div class="m-3 text-center">
                <p class="text-app-text-600 dark:text-app-text-dark-500">
                  A standard token has been detected. This token will be saved to your custom tokens instead of your input. Do you want to proceed?
                </p>
              </div>
              <div class="flex flex-row items-center my-6 mx-3">
                <Button class="flex-auto mx-2 w-1/2" :block="true" variant="tertiary" @click="onCancel">
                  {{ $t("walletTransfer.cancel") }}
                </Button>
                <Button class="flex-auto mx-2 w-1/2" :disabled="importDisabled" :block="true" variant="primary" @click="onImport">
                  {{ $t("walletTransfer.confirm") }}
                </Button>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
<style scoped>
.img_preview {
  max-width: 160px;
  min-width: 160px;
  @apply h-40 rounded-md object-cover;
}

.property-name {
  @apply font-bold text-sm leading-4;
}

.property-value {
  @apply text-sm leading-4;
}
</style>
