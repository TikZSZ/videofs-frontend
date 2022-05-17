<template>
  <div
    class="h-20 relative flex flex-row items-center justify-around bg-slate-900 gap-x-10"
  >
    <!-- logo -->
    <div
      class=" text-white font-medium text-xl justify-center cursor-pointer"
      @click="router.push('/')"
    >
      VFS
    </div>
    <!-- // links -->
    <div
      class=" flex flex-rows hover:cursor-pointer gap-x-10 justify-center"
    >
      <NavLinks
        v-for="route in routes"
        :onClick="
          () => {
            router.push({
              path: route.path,
            });
          }
        "
        :active="isActive(route.path)"
      >
        {{ route.name }}
      </NavLinks>
    </div>
    <!-- important buttons -->
    <div class="basis-96 flex  flex-rows gap-x-10 justify-center">
      <Auth :isActive="isActive" />
      <Wallet class="absolute top-1/4 right-10" />
    </div>
      
  </div>
  <div class="h-[1px] absolute mx-auto left-0 min-w-[100%] bg-slate-800"></div>
</template>

<script lang="ts" setup>
import NavLinks from "./NavItems.vue";
import { useRouter } from "vue-router";
import { useStore } from "@/stores";
import { computed, onMounted, reactive, ref } from "vue";
import Wallet from "./Wallet.vue";
import Auth from "./Auth.vue";
const store = reactive(useStore());
const connectingWallet = ref(false);
const router = useRouter();
const routes = [
  {
    name: "Home",
    path: "/",
  },
  {
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    name: "App",
    path: "/app",
  },
  {
    name: "About",
    path: "/about",
  },
];


function isActive(path: string) {
  return store.activePath!.split("/")[1] === path.split("/")[1];
}

async function main() {
  await store.connectWallet(store.walletsFound[0]);
}
</script>
