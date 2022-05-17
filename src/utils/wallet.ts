//import {Wallet} from "@/utils/liblogin/Wallet"
import { Wallet } from "liblogin-client";

const AppMetaData = {
  name: "LibLogin",
  description: "LibLogin is login solution for hedera",
  icon: "",
};

const wallet = new Wallet(AppMetaData, {
  debug: false,
  multiAccount: true,
  network: "testnet",
});

wallet.on("statusChange", (status) => {
  console.log(status);
});

wallet.on("walletsFound", (wallet) => {
  console.log("found wallet", wallet);
});

wallet.on("pair", (val) => {
  console.log("paired and here is the data", val);
});

wallet.on("walletConnect", (accountIds) => {
  console.log("wallet connected by", accountIds);
});

export { wallet };
