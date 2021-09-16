import { LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin";
import { onMounted, readonly, ref, watch } from "vue";
import { useRouter } from "vue-router";

import OpenLoginFactory from "@/auth/OpenLogin";
import OpenLoginHandler from "@/auth/OpenLoginHandler";

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

export async function login({ loginProvider }: { loginProvider: LOGIN_PROVIDER_TYPE }): Promise<void> {
  const handler = new OpenLoginHandler({
    loginProvider,
    extraLoginOptions: {},
  });
  const result = await handler.handleLoginWindow();
  state.value = {
    publicAddress: "<public address>",
    privateKey: result.privKey,
    name: result.userInfo.name,
    email: result.userInfo.email,
    imageURL: result.userInfo.profileImage,
  };
}

export async function logout(): Promise<void> {
  if (!state.value) return;
  const openlogin = await OpenLoginFactory.getInstance();
  try {
    await openlogin.logout();
  } finally {
    state.value = undefined;
  }
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
