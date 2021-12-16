<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XCircleIcon, XIcon } from "@heroicons/vue/solid";

import { Button } from "@/components/common";
import ControllerModule from "@/modules/controllers";
import { STATUS_ERROR, STATUS_INFO, STATUS_SUCCESS, STATUS_TYPE, STATUS_WARNING } from "@/utils/enums";

withDefaults(
  defineProps<{
    isOpen?: boolean;
    title: string;
    description?: string;
    status?: STATUS_TYPE;
  }>(),
  {
    isOpen: false,
    description: "",
    status: STATUS_INFO,
  }
);
const emits = defineEmits(["onClose"]);

const closeModal = () => {
  emits("onClose");
};
</script>
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog :class="{ dark: ControllerModule.isDarkMode }" as="div" @close="closeModal">
      <div class="fixed inset-0 z-10 overflow-y-auto">
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
            <div class="inline-block w-96 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-app-gray-700 rounded-md">
              <DialogTitle
                as="div"
                class="bg-white dark:bg-app-gray-700 shadow dark:shadow-dark rounded-md flex justify-center py-8 relative"
                tabindex="0"
              >
                <CheckCircleIcon v-if="status === STATUS_SUCCESS" class="w-20 h-20 text-app-success" />
                <XCircleIcon v-else-if="status === STATUS_ERROR" class="w-20 h-20 text-app-error" />
                <ExclamationCircleIcon v-else-if="status === STATUS_WARNING" class="w-20 h-20 text-app-warning" />
                <InformationCircleIcon v-else class="w-20 h-20 text-app-info" />
                <XIcon class="w-6 h-6 absolute top-3 right-3 text-app-text-500 cursor-pointer" @click="closeModal" />
              </DialogTitle>

              <div class="mt-4 mx-8 mb-8">
                <div class="text-center font-header text-md font-bold text-app-text-500 dark:text-app-text-dark-500">{{ title }}</div>
                <div v-if="description" class="text-center mt-3 font-body text-base text-app-text-500 dark:text-app-text-dark-500">
                  {{ description }}
                </div>
                <Button class="mt-5" :block="true" variant="tertiary" @click="closeModal">Close</Button>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
