import { omit } from "lodash-es";

import MobActivity from "@/assets/mob-activity.svg";
import MobDiscover from "@/assets/mob-discover.svg";
import MobHome from "@/assets/mob-home.svg";
import MobNft from "@/assets/mob-nft.svg";
import MobSettings from "@/assets/mob-settings.svg";

import { isTopupHidden } from "./whitelabel";

const navList: {
  [key: string]: {
    name: string;
    title: string;
    route: string;
    icon: string;
    mobHidden: boolean;
    navHidden: boolean;
  };
} = {
  home: {
    name: "navBar.home",
    title: "walletHome.walletHome",
    route: "home",
    icon: MobHome,
    mobHidden: false,
    navHidden: false,
  },
  transfer: {
    name: "navBar.transfer",
    title: "walletTransfer.transferDetails",
    route: "transfer",
    icon: MobHome,
    mobHidden: true,
    navHidden: true,
  },
  topup: {
    name: "navBar.topUp",
    title: "walletTopUp.selectProvider",
    route: "topup",
    icon: MobHome,
    mobHidden: true,
    navHidden: true,
  },
  nfts: {
    name: "navBar.nfts",
    title: "navBar.nfts",
    route: "nfts",
    icon: MobNft,
    mobHidden: false,
    navHidden: false,
  },
  pay: {
    name: "navBar.pay",
    title: "walletPay.pay",
    route: "pay",
    icon: MobActivity,
    mobHidden: true,
    navHidden: true,
  },
  activity: {
    name: "navBar.activity",
    title: "walletActivity.transactionActivities",
    route: "activity",
    icon: MobActivity,
    mobHidden: false,
    navHidden: false,
  },
  settings: {
    name: "navBar.settings",
    title: "walletSettings.settings",
    route: "settings",
    icon: MobSettings,
    mobHidden: false,
    navHidden: false,
  },
  discover: {
    name: "navBar.discover",
    title: "Discover",
    route: "discover",
    icon: MobDiscover,
    mobHidden: false,
    navHidden: false,
  },
};

function getNavList() {
  return isTopupHidden() ? omit(navList, "topup") : navList;
}

export const NAVIGATION_LIST = getNavList();
