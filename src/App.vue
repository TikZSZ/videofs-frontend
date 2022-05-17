<script setup lang="ts">
import { RouterView, useRoute, useRouter } from "vue-router";
import Navbar from "@/components/Navbar/Navbar.vue";
import { useStore } from "./stores";
import { onMounted, ref, watch } from "vue";

const appRef = ref<null | HTMLElement>(null);
const store = useStore();
const route = useRoute()
const router = useRouter()
async function main() {
  try {
    await store.getCurrentUser();
  } catch (err) {}
}


watch(
  () => store.user,
  (n,p,cleanUp) => {
    if(n === null){
      const requiresAuth = !!(route.meta.requiresAuth)
      if(requiresAuth){
        router.push("/")
      }
    }
  }
);

onMounted(() => {
  console.log(appRef.value);
  if (appRef.value) {
    store.height = appRef.value.offsetHeight;
    store.width = appRef.value.offsetWidth;
  }
});
main();
</script>

<template>
  <div class="bg-h-bg" ref="appRef">
    <div class="min-h-screen text-h-text mx-auto w-11/12 max-w-screen">
      <div class="">
        <Navbar />
      </div>
      <RouterView />
    </div>
  </div>
</template>
