import { readonly, ref } from "vue";

interface ToastMessageType {
  type: "error" | "success" | "warning" | "info";
  message: string;
}
interface State {
  isDarkMode: boolean;
  toastMessages: ToastMessageType[];
}

const state = ref<State>({
  isDarkMode: true,
  toastMessages: [],
});

export function setDarkMode(isDarkMode: boolean): void {
  if (!state.value) return;
  state.value.isDarkMode = isDarkMode;
}

export function addToast(toast: ToastMessageType): void {
  state.value.toastMessages.push(toast);
  setTimeout(removeToast, 5000, toast);
}

export function removeToast(toast: ToastMessageType): void {
  const target = state.value.toastMessages.indexOf(toast);
  state.value.toastMessages.splice(target, 1);
}

export const app = readonly(state);
