<script lang="ts" setup>
import SideBar from "@/components/Sidebar/Sidebar.vue";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute()
const router = useRouter()

const currentRoute = computed(() => {
  return route.fullPath
})

if(currentRoute.value.split("/")[1] === "dashboard" && !currentRoute.value.split("/")[2]){
  router.push("/dashboard/topic")
}
</script>

<template>
  <div class="flex flex-row min-h-[90vh] mx-auto">
    <SideBar class="basis-1/4 xl:basis-3/12"></SideBar>
    <div class="px-12 py-10 basis-3/4 xl:basis-9/12">
      <!-- <div
        class="group border-indigo-500 hover:bg-white hover:shadow-lg hover:border-transparent ..."
      >
        <p class="text-indigo-600 group-hover:text-gray-900 ...">New Project</p>
        <p class="text-indigo-500 group-hover:text-gray-500 ...">
          Create a new project from a variety of starting templates.
        </p>
      </div> -->
      <router-view></router-view>
    </div>
  </div>
</template>
