import { readonly, ref } from "vue";

type State =
  | {
      isDarkMode: boolean;
    }
  | undefined;

const state = ref<State>({ isDarkMode: true });

export function setDarkMode(isDarkMode: boolean): void {
  if (!state.value) return;
  state.value.isDarkMode = isDarkMode;
}

export const app = readonly(state);
