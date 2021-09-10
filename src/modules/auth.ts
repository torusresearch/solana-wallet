import delayAsync from "delay-async";
import { onMounted, readonly, ref, watch } from "vue";
import { useRouter } from "vue-router";

type State =
  | {
      publicAddress: string;
      privateKey: string;
      name: string;
      email: string;
      imageURL: string;
    }
  | undefined;

const preStoredItem = localStorage.getItem("auth");
const state = ref<State>(preStoredItem ? JSON.parse(preStoredItem) : undefined);

watch(state, (value) => {
  if (value) localStorage.setItem("auth", JSON.stringify(value));
  else localStorage.removeItem("auth");
});

export const user = readonly(state);

export async function login(email: string, password: string): Promise<void> {
  // TODO: Implement login
  console.log("Logging in...", { email, password });
  await delayAsync(2000);

  state.value = {
    publicAddress: "<public address>",
    privateKey: "<private key>",
    name: "Tom Cook",
    email,
    imageURL:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  };
}

export async function logout(): Promise<void> {
  if (!state.value) return;

  // TODO: Implement login
  console.log("Logging out...", state.value);
  await delayAsync(500);

  state.value = undefined;
}

export function onAuthChanged(callback: (user: State) => void): void {
  onMounted(() => callback(state.value));
  watch(state, callback);
}

export function requireLoggedIn(): void {
  const router = useRouter();
  onAuthChanged((value) => {
    if (!value) router.push("/login");
  });
}
