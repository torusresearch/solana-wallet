<script setup lang="ts">
import { Dialog, DialogOverlay, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { ref } from "vue";

import { Button } from "@/components/common";
import ControllerModule from "@/modules/controllers";

withDefaults(
  defineProps<{
    isOpen?: boolean;
  }>(),
  {
    isOpen: false,
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
    <Dialog :open="isOpen" focus="refDiv" :class="{ dark: ControllerModule.isDarkMode }" as="div" @close="closeModal">
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
            <div class="relative inline-block md:w-96 align-middle transition-all bg-white dark:bg-app-gray-700 rounded-md">
              <!-- <DialogTitle
                as="div"
                class="bg-white dark:bg-app-gray-700 shadow dark:shadow-dark rounded-md flex justify-center py-8 relative"
                tabindex="0"
              >
              </DialogTitle> -->

              <div class="mt-4 mx-4 mb-8 flex flex-col justify-around items-center">
                <div class="p-4 text-center font-header text-xl font-bold text-app-text-500 dark:text-app-text-dark-500">
                  Session expired. Please login again.
                </div>
                <Button ref="refDiv" class="" :block="true" variant="tertiary" @click="closeModal">Logout</Button>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
