<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { helpers, required } from "@vuelidate/validators";
import log from "loglevel";
import { computed, reactive, ref, withDefaults } from "vue";

import { Button, SelectField, TextField } from "@/components/common";
import ControllersModule from "@/modules/controllers";

interface IImportType {
  label: string;
  value: string;
}

const props = withDefaults(
  defineProps<{
    isOpen?: boolean;
  }>(),
  {
    isOpen: false,
  }
);

const importTypes: IImportType[] = [{ label: "Private Key", value: "PrivateKey" }];

const importState = reactive<{
  privateKey: string;
  importType: IImportType;
}>({
  importType: importTypes[0],
  privateKey: "",
});

const keyError = ref<boolean>(false);
const disableWhileFetching = ref<boolean>(false);

const emits = defineEmits(["onClose"]);

const closeModal = () => {
  importState.privateKey = "";
  emits("onClose");
};

const resetKeyError = () => {
  keyError.value = false;
};

const keyIsValid = () => {
  return !keyError.value;
};

const rules = {
  privateKey: {
    required: helpers.withMessage("Required", required),
  },
  validKey: helpers.withMessage("Invalid Private Key", keyIsValid),
};
const $v = useVuelidate(rules, importState, { $autoDirty: true });

const disableBTN = computed(() => {
  if (importState.importType.value === "PrivateKey" && $v?.value.privateKey.$error) return true;
  return false;
});

const importExternalAccount = async () => {
  if (!$v.value.$validate()) return;
  let resolvedKey: string;
  try {
    disableWhileFetching.value = true;
    resolvedKey = await ControllersModule.resolveKey({
      key: importState.privateKey,
      strategy: importState.importType.value,
    });
    await ControllersModule.importExternalAccount(resolvedKey);
    disableWhileFetching.value = false;
    closeModal();
  } catch (e) {
    disableWhileFetching.value = false;
    keyError.value = true;
    $v.value.$touch();
    log.error(e);
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
        :errors="$v.$errors"
        @input="resetKeyError"
        @keydown.enter="
          (e) => {
            importExternalAccount();
            e.stopImmediatePropagation();
          }
        "
      ></TextField>
      <div class="w-full flex flex-row justify-end mt-6">
        <Button size="small" variant="tertiary" class="mr-2" tabindex="0" @click="closeModal" @keydown="closeModal">Back</Button>
        <Button size="small" variant="primary" tabindex="0" :disabled="disableBTN || disableWhileFetching" @click="importExternalAccount"
          >Import</Button
        >
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
