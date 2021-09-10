import { readonly, ref } from "vue";

interface State {
  isDarkMode: boolean;
}

const state = ref<State>({ isDarkMode: true });

export function setDarkMode(isDarkMode: boolean): void {
  if (!state.value) return;
  state.value.isDarkMode = isDarkMode;
}

export const app = readonly(state);
