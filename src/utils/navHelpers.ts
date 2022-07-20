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
  };
} = {
  home: {
    name: "navBar.home",
    title: "walletHome.walletHome",
    route: "home",
    icon: MobHome,
    mobHidden: false,
  },
  transfer: {
    name: "navBar.transfer",
    title: "walletTransfer.transferDetails",
    route: "transfer",
    icon: MobHome,
    mobHidden: true,
  },
  topup: {
    name: "navBar.topUp",
    title: "walletTopUp.selectProvider",
    route: "topup",
    icon: MobHome,
    mobHidden: true,
  },
  nfts: {
    name: "navBar.nfts",
    title: "navBar.nfts",
    route: "nfts",
    icon: MobNft,
    mobHidden: false,
  },
  activity: {
    name: "navBar.activity",
    title: "walletActivity.transactionActivities",
    route: "activity",
    icon: MobActivity,
    mobHidden: false,
  },
  settings: {
    name: "navBar.settings",
    title: "walletSettings.settings",
    route: "settings",
    icon: MobSettings,
    mobHidden: false,
  },
  discover: {
    name: "navBar.discover",
    title: "Discover",
    route: "discover",
    icon: MobDiscover,
    mobHidden: false,
  },
};

function getNavList() {
  return isTopupHidden() ? omit(navList, "topup") : navList;
}

export const NAVIGATION_LIST = getNavList();
