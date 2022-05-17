<script lang="ts" setup>
import { useStore } from "@/stores";
import { ref } from "vue";
import OverlayVue from "@/components/Overlay.vue";
const store = useStore();
const isActive = ref(false)
</script>

<template>
  <div v-if="store.isWalletConnected">
    <OverlayVue :isActive="isActive">
    <pre class="text-orange-400 ">Caution changing account will lead to logout</pre>
      <div
        v-for="account of store.accountIds"
        class="border-h-text text-h-text hover:bg-sky-900 hover:border-sky-900 border-2 p-5 my-5 rounded-xl font-medium relative cursor-pointer "
        @click="() => {
          store.selectAccount(account)
          isActive = false
        }"
      >
        {{ account }} <span class="text-white bg-sky-800 p-1 px-2 rounded-md w-fit" v-if="store.selectedAccount === account">
          Currently Selected
        </span> 
        
      </div>
    </OverlayVue>
    <!-- Currently selected account id -->
    <div
      class="hover:border-sky-900 hover:text-h-text hover:bg-sky-900 bg-sky-600 border-sky-600 border-2 px-3 rounded-xl font-medium relative cursor-pointer -mt-1"
      @click="
        async () => {
          isActive = true
        }
      "
    >
      {{ store.selectedAccount }}
    </div>
  </div>
</template>
