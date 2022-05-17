<script setup lang="ts">
import { wallet } from "@/utils/wallet";
import { useStore } from "@/stores";
import { reactive, ref } from "vue";
import { useClipboard } from "@vueuse/core";
import OverlayVue from "@/components/Overlay.vue";
import SelectAccountVue from "./SelectAccount.vue";
import ButtonVue from "@/components/Button.vue"
const store = reactive(useStore());
const clipboard = useClipboard();

wallet.on("walletsFound", (wallet) => {
  store.walletsFound.push(wallet);
});
wallet.on("walletConnect", ({ accountIds }) => {
  store.updateAccountIds(accountIds);
});
wallet.init();
</script>

<template>
  <div class="">
    <!-- Connect wallet  -->
    <div
      v-for="walletMeta of store.walletsFound"
      v-if="!store.isWalletConnected"
      v-bind="$attrs"
      class="border-h-text text-h-text hover:bg-sky-600 hover:border-sky-600 border-2 py-1 px-2 rounded-xl uppercase font-medium relative cursor-pointer mt-1"
      @click="store.connectWallet(walletMeta)"
    >
      Connect Wallet
    </div>
    <!-- Disconnect wallet  -->
    <div v-else class="flex flex-col gap-y-3">
      <div
        class="border-h-text text-h-text hover:bg-sky-600 hover:border-sky-600 border-2 px-3 rounded-xl uppercase font-medium relative cursor-pointer -mt-3"
        @click="
          async () => {
            await store.disconnectWallet();
          }
        "
      >
        Disconnect
      </div>
      <SelectAccountVue />
    </div>

    <!-- Get User to pair wallet intially -->
    <OverlayVue :isActive="store.pairingState.initialPair || false">
      <div>
        <div
          @click="() => {
          store.pairingState.connectLocalWallet!()
          store.pairingState.initialPair = false
        }"
          v-if="store.pairingState.selectedWallet"
          class="flex flex-row mx-auto justify-center py-3 border-sky-500 hover:border-slate-700 hover:bg-slate-700 border-2 rounded-lg cursor-pointer my-5"
        >
          <p class="text-white text-lg">Connect to</p>
          <img
            :src="store.pairingState.selectedWallet!.icon"
            width="35"
            :alt="store.pairingState.selectedWallet!.description"
            class="rounded-2xl top-1 left-0 mx-2"
          />
          <p class="text-lg">
            {{ store.pairingState.selectedWallet!.name }}
          </p>
        </div>
        <p class="break-all overflow-x-auto my-5">
          <span class="text-sky-500">Pairing Sting : </span>
          {{ store.pairingState.pairingString }}
        </p>
        <ButtonVue
          text="Copy"
          @click="clipboard.copy(store.pairingState.pairingString!)"
          class="relative bg-sky-900"
        >
        </ButtonVue>
        <ButtonVue
          text="Close"
          class="relative mx-2 bg-sky-900"
          @click="
            () => {
              store.pairingState.initialPair = false;
            }
          "
        ></ButtonVue>
      </div>
    </OverlayVue>
  </div>
</template>
