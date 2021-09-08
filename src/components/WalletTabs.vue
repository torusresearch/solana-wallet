<script setup lang="ts">
import {
  ChevronDownIcon,
  PlusIcon,
  BellIcon,
  InformationCircleIcon,
  MenuIcon,
  XIcon,
} from "@heroicons/vue/outline";
import {
  ClipboardCopyIcon,
  QrcodeIcon,
  ExternalLinkIcon,
  BriefcaseIcon,
} from "@heroicons/vue/solid";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/vue";

import CasperLogoURL from "@/assets/casper.svg";

// TODO: Hookup
import { user, logout, requireLoggedIn } from "@/modules/auth";
// import { logout } from "@/modules/auth";
import Button from "./common/Button.vue";

requireLoggedIn();

// const user = {
//   imageURL: "https://i.pravatar.cc/150?img=5",
//   name: "Satoshi Nakamoto",
//   email: "satosh@gmail.com",
// };

defineProps<{
  tab: keyof typeof tabs;
}>();

const tabs = {
  home: { name: "Home", title: "Account Balance" },
  transfer: { name: "Transfer", title: "Transfer Details" },
  topup: { name: "Top Up", title: "Select a Provider" },
  activity: { name: "Activity", title: "Transaction Activities" },
  settings: { name: "Settings", title: "Settings" },
};

const userNavigations = [
  { name: "Import Account", to: "#", icon: PlusIcon },
  { name: "Info and Support", to: "#", icon: InformationCircleIcon },
];
</script>

<template>
  <div v-if="user" class="min-h-screen bg-white">
    <Disclosure
      v-slot="{ open }"
      as="nav"
      class="bg-white border-b border-gray-200"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex h-16">
          <div class="flex-none flex items-center">
            <router-link to="/wallet/home">
              <img
                class="hidden lg:block h-7 w-auto"
                :src="CasperLogoURL"
                alt="Casper Logo"
              />
            </router-link>
          </div>
          <div class="flex flex-grow">
            <div class="hidden sm:-my-px sm:mx-auto sm:flex sm:space-x-0">
              <router-link
                v-for="(value, key) in tabs"
                :key="key"
                :to="`/wallet/${key}`"
                :class="[
                  key === tab
                    ? 'border-app-primary-500 text-app-primary-500'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'inline-flex items-center px-4 pt-1 border-b-2 text-sm font-medium',
                ]"
                :aria-current="key === tab ? 'page' : undefined"
                >{{ value.name }}</router-link
              >
            </div>
          </div>
          <div class="hidden flex-none sm:ml-6 sm:flex sm:items-center">
            <!-- Profile dropdown -->
            <Menu as="div" class="ml-3 relative z-10">
              <div>
                <MenuButton
                  class="
                    max-w-xs
                    bg-white
                    flex
                    items-center
                    text-sm
                    rounded-full
                    focus:outline-none
                    focus:ring-2
                    focus:ring-offset-2
                    focus:ring-primary-500
                  "
                >
                  <span class="sr-only">Open user menu</span>
                  <div class="flex items-center">
                    <span class="font-body text-sm font-bold">{{
                      user.name
                    }}</span>
                    <ChevronDownIcon class="w-5" />
                  </div>
                </MenuButton>
              </div>
              <transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <MenuItems
                  class="
                    origin-top-right
                    absolute
                    right-0
                    mt-2
                    w-96
                    rounded-md
                    shadow-lg
                    py-1
                    bg-white
                    ring-1 ring-black ring-opacity-5
                    focus:outline-none
                  "
                >
                  <div class="flex items-center p-4">
                    <img
                      class="rounded-full w-10 mr-2"
                      :src="user.imageURL"
                      alt=""
                    />
                    <div class="font-body font-bold text-base">
                      {{ user.name }}'s Account
                    </div>
                  </div>
                  <div class="px-3 pb-3">
                    <div class="shadow py-2 px-3">
                      <div class="flex">
                        <div class="flex items-center">
                          <BriefcaseIcon class="w-4 h-4 mr-1" />
                          <div class="font-body font-bold text-sm">
                            {{ user.email }}
                          </div>
                        </div>
                        <div class="ml-auto">0.152 USD</div>
                      </div>
                      <div class="flex">
                        <div class="font-body text-xs w-52 pl-5 break-all">
                          0x0F48654993568658514F982C87A5BDd01D80969F
                        </div>
                        <div class="ml-auto flex space-x-1">
                          <div
                            class="
                              rounded-full
                              w-6
                              h-6
                              flex
                              items-center
                              bg-gray-200
                              justify-center
                              cursor-pointer
                            "
                          >
                            <ClipboardCopyIcon class="w-4 h-4" />
                          </div>
                          <div
                            class="
                              rounded-full
                              w-6
                              h-6
                              flex
                              items-center
                              bg-gray-200
                              justify-center
                              cursor-pointer
                            "
                          >
                            <QrcodeIcon class="w-4 h-4" />
                          </div>
                          <div
                            class="
                              rounded-full
                              w-6
                              h-6
                              flex
                              items-center
                              bg-gray-200
                              justify-center
                              cursor-pointer
                            "
                          >
                            <ExternalLinkIcon class="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <MenuItem
                    v-for="nav in userNavigations"
                    :key="nav.name"
                    v-slot="{ active }"
                  >
                    <router-link
                      is="router-link"
                      :to="nav.to"
                      :class="[
                        active ? 'bg-gray-100' : '',
                        'border-t flex items-center w-full text-left px-4 py-4 text-sm font-bold text-gray-700',
                      ]"
                    >
                      <component
                        :is="nav.icon"
                        class="w-4 h-4 mr-2 text-gray-700"
                        aria-hidden="true"
                      ></component
                      >{{ nav.name }}</router-link
                    >
                  </MenuItem>
                  <div class="p-4 border-t">
                    <Button class="ml-auto" variant="tertiary" @click="logout"
                      >Logout</Button
                    >
                  </div>
                </MenuItems>
              </transition>
            </Menu>
          </div>
          <div class="-mr-2 flex items-center sm:hidden">
            <!-- Mobile menu button -->
            <DisclosureButton
              class="
                bg-white
                inline-flex
                items-center
                justify-center
                p-2
                rounded-md
                text-gray-400
                hover:text-gray-500 hover:bg-gray-100
                focus:outline-none
                focus:ring-2
                focus:ring-offset-2
                focus:ring-indigo-500
              "
            >
              <span class="sr-only">Open main menu</span>
              <MenuIcon v-if="!open" class="block h-6 w-6" aria-hidden="true" />
              <XIcon v-else class="block h-6 w-6" aria-hidden="true" />
            </DisclosureButton>
          </div>
        </div>
      </div>

      <DisclosurePanel class="sm:hidden">
        <div class="pt-2 pb-3 space-y-1">
          <a
            v-for="(value, key) in tabs"
            :key="key"
            :to="`/wallet/${key}`"
            :class="[
              key === tab
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800',
              'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
            ]"
            :aria-current="key === tab ? 'page' : undefined"
            >{{ value.name }}</a
          >
        </div>
        <div class="pt-4 pb-3 border-t border-gray-200">
          <div class="flex items-center px-4">
            <div class="flex-shrink-0">
              <img class="h-10 w-10 rounded-full" :src="user.imageURL" alt />
            </div>
            <div class="ml-3">
              <div class="text-base font-medium text-gray-800">
                {{ user.name }}
              </div>
              <div class="text-sm font-medium text-gray-500">
                {{ user.email }}
              </div>
            </div>
            <button
              type="button"
              class="
                ml-auto
                bg-white
                flex-shrink-0
                p-1
                rounded-full
                text-gray-400
                hover:text-gray-500
                focus:outline-none
                focus:ring-2
                focus:ring-offset-2
                focus:ring-indigo-500
              "
            >
              <span class="sr-only">View notifications</span>
              <BellIcon class="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div class="mt-3 space-y-1">
            <router-link
              v-for="nav in userNavigations"
              :key="nav.name"
              :to="nav.to"
              class="
                block
                w-full
                text-left
                px-4
                py-2
                text-base
                font-medium
                text-gray-500
                hover:text-gray-800 hover:bg-gray-100
              "
              >{{ nav.name }}</router-link
            >
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>

    <div class="py-6">
      <header>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold leading-tight text-gray-900">
            {{ tabs[tab].title }}
          </h1>
        </div>
      </header>
      <main>
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
