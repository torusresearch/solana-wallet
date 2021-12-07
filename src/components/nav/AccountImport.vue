<script setup lang="ts">
import { QuestionCircleIcon } from "@toruslabs/vue-icons/others";
import { useVuelidate } from "@vuelidate/core";
import { helpers, required } from "@vuelidate/validators";
import log from "loglevel";
import { computed, reactive, Ref, ref, withDefaults } from "vue";

import { Button } from "@/components/common";
import ControllersModule from "@/modules/controllers";

import SelectField from "../common/SelectField.vue";
import TextField from "../common/TextField.vue";

const props = withDefaults(
  defineProps<{
    isOpen?: boolean;
  }>(),
  {
    isOpen: false,
  }
);

const keystoreUpload = ref(null);
const fileContent: Ref<string | ArrayBuffer | null | undefined> = ref(null);

interface IImportType {
  label: string;
  value: string;
}

defineExpose({ keystoreUpload });

const importTypes: IImportType[] = [
  { label: "Private Key", value: "PrivateKey" },
  // { label: "Keystore", value: "Keystore" },
];

const importState = reactive<{
  privateKey: string;
  keystorePassword: string;
  importType: IImportType;
}>({
  importType: importTypes[0],
  privateKey: "",
  keystorePassword: "",
});

const emits = defineEmits(["onClose"]);

const closeModal = () => {
  emits("onClose");
};

const rules = {
  privateKey: {
    required: helpers.withMessage("Required", required),
  },
  keystorePassword: {
    required: helpers.withMessage("Required", required),
  },
};
const $v = useVuelidate(rules, importState, { $autoDirty: true });

const disableBTN = computed(() => {
  if (importState.importType.value === "PrivateKey" && $v.value.privateKey.$error) return true;
  if (importState.importType.value === "Keystore" && $v.value.keystorePassword.$error) return true;
  return false;
});

const importAccount = async () => {
  let resolvedKey: string;
  try {
    resolvedKey = await ControllersModule.resolveKey({ key: importState.privateKey, strategy: importState.importType.value });
    await ControllersModule.importAccount(resolvedKey);
    closeModal();
  } catch (e) {
    log.error(e);
  }
};

const openFilePicker = () => {
  keystoreUpload?.value?.click();
};

const processFile = (ev: Event) => {
  try {
    const file = (ev?.target as HTMLInputElement)?.files?.[0];
    const fileReader = new FileReader();
    fileReader.addEventListener("load", (event: Event) => {
      fileContent.value = event?.target?.result;
    });
    fileReader.readAsText(file, "utf-8");
  } catch (error: unknown) {
    log.error(error);
  }
};
</script>

<template>
  <div
    v-if="props.isOpen"
    class="overflow-hidden h-full w-full inset-0 fixed z-40 fade-in flex items-center justify-center"
    @mousedown.self.stop="closeModal"
  >
    <div class="flex flex-col px-8 py-4 max-w-2xl bg-white dark:bg-app-gray-700 relative z-50 rounded-md importModal scale-in">
      <h1 class="text-lg text-app-text-600 dark:text-app-text-dark-500 font-bold mb-4">Import Account</h1>
      <SelectField v-model="importState.importType" size="medium" label="Select Import Type:" :items="importTypes" tabindex="0" />
      <TextField
        v-if="importState.importType.value === importTypes[0].value"
        v-model="importState.privateKey"
        size="medium"
        label="Input Private Key:"
        type="password"
        placeholder="Private Key"
        class="mt-6"
        tabindex="0"
        :errors="$v.privateKey.$errors"
      ></TextField>
      <div v-else class="mt-6">
        <div class="flex flex-row justify-between">
          <span>
            <h2 class="inline text-app-text-600 dark:text-app-text-dark-500 mr-2">Please upload your JSON File</h2>
            <QuestionCircleIcon class="h-4 w-4 inline text-app-text-600 dark:text-app-text-dark-500" />
          </span>
          <div
            class="h-8 w-24 rounded-md bg-transparent primary text-primary flex items-center justify-center outline-primary"
            tabindex="0"
            @click="openFilePicker"
            @keydown="openFilePicker"
          >
            <QuestionCircleIcon class="h-4 w-4 inline text-primary mr-2 text-sm" />
            Upload
            <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
            <input v-show="false" ref="keystoreUpload" multiple="false" type="file" @change="processFile" />
          </div>
        </div>
        <TextField
          v-model="importState.keystorePassword"
          size="medium"
          label="Enter your password:"
          placeholder="Password"
          class="mt-4"
          tabindex="0"
          :errors="$v.keystorePassword.$errors"
        ></TextField>
      </div>
      <div class="w-full flex flex-row justify-end mt-6">
        <Button size="small" variant="tertiary" class="mr-2" tabindex="0" @click="closeModal" @keydown="closeModal">Back</Button>
        <Button size="small" variant="primary" tabindex="0" :disabled="disableBTN" @click="importAccount">Import</Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-in {
  animation: fadeIn 0.2s 1 forwards;
}
@keyframes fadeIn {
  0% {
    background-color: rgba(0, 0, 0, 0);
  }

  100% {
    background-color: rgba(0, 0, 0, 0.2);
  }
}

.scale-in {
  animation: scaleIn 0.5s 1 forwards;
}
@keyframes scaleIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.importModal {
  width: 600px;
}

.text-primary {
  color: #9945ff;
}
.outline-primary {
  outline: 1px dashed #9945ff;
  outline-offset: 2px;
  cursor: pointer;
}

.outline-primary:hover {
  background-color: rgba(153, 69, 255, 0.1) !important;
}
</style>
