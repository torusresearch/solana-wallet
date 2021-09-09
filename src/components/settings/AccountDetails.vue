<script setup lang="ts">
import { ref } from "vue";
import {
  ClipboardCopyIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
} from "@heroicons/vue/outline";

import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogOverlay,
  DialogTitle,
} from "@headlessui/vue";

import { Button } from "@/components/common";

const isOpen = ref(false);
const isKeyShown = ref(false);

const closeModal = () => {
  isOpen.value = false;
};
const openModal = () => {
  isOpen.value = true;
};
</script>
<template>
  <div
    class="
      flex
      p-3
      items-center
      cursor-pointer
      rounded rounded:md
      hover:bg-app-gray-200
    "
    @click="openModal"
  >
    <KeyIcon class="w-5 h-5 mr-5" />
    <div class="text-base font-body">Account Details</div>
  </div>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="closeModal">
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="min-h-screen px-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <DialogOverlay class="fixed inset-0" />
          </TransitionChild>

          <span class="inline-block h-screen align-middle" aria-hidden="true"
            >&#8203;</span
          >

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
              class="
                inline-block
                w-full
                max-w-2xl
                p-6
                my-8
                overflow-hidden
                text-left
                align-middle
                transition-all
                transform
                bg-white
                shadow-xl
                rounded-2xl
              "
            >
              <DialogTitle
                as="h3"
                class="text-lg font-bold leading-6 text-app-text-500"
                >Private Key</DialogTitle
              >
              <div class="mt-5 flex items-center">
                <div class="flex items-center">
                  <KeyIcon class="w-5 h-5 mr-3 text-app-text-400" />
                  <div class="font-body font-medium">Show Private Key</div>
                </div>
                <div class="ml-auto">
                  <Button variant="text" @click="isKeyShown = !isKeyShown">
                    <EyeOffIcon v-if="isKeyShown" class="w-5 h-5" />
                    <EyeIcon v-else class="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div v-if="isKeyShown" class="pl-8 flex items-center mt-2">
                <div class="font-body text-xs text-app-text-500 mr-2">
                  F48654993568658514F982C87A5BDd01D80969FF48654993568658
                </div>
                <Button variant="text">
                  <ClipboardCopyIcon class="w-4 h-4 mr-1" />
                  Click to copy
                </Button>
              </div>

              <div class="mt-8">
                <Button class="ml-auto" variant="tertiary" @click="closeModal"
                  >Close</Button
                >
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
