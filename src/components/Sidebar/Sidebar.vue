<script lang="ts" setup>
import { useStore } from "@/stores";
import SidebarItems from "./SidebarItems.vue";
import SidebarMenu from "./SidebarMenu.vue";

const menuOptions = {
  "IPFS Identities": [
    {
      name: "Topic",
      path: "/dashboard/topic",
    },
    {
      name: "Decentralised Identity",
      path: "/dashboard/decentralised-identity",
    },
    {
      name: "Profile",
      path: "/dashboard/profile",
    },
    {
      name: "Channel",
      path: "/dashboard/channel",
    },
    {
      name: "Video IPFS Records",
      path: "/dashboard/ipfs-videos",
    },
  ],
  "Content Managment": [
    {
      name: "Videos",
      path: "/dashboard/videos",
    },
    {
      name: "Playlists",
      path: "/dashboard/editors",
    },
  ],
  "Misc" : [
    {
      name: "Tokens",
      path: "/dashboard/tokens",
    },
    {
      name: "Payments",
      path: "/dashboard/payments",
    },
  ]
};

const store = useStore()
</script>

<template>
  <div class="w-full border-r-2">
    <div class="my-10 mr-20 xl:mr-5 w-full">
        <SidebarMenu :title="'IPFS Identities'"
        class="mt-10">
          <SidebarItems :menuOption="menuOptions['IPFS Identities']" />
        </SidebarMenu>
        <SidebarMenu v-if="store.hasChannel" title="Content Managment"
        class="mt-10">
          <SidebarItems  :menuOption="menuOptions['Content Managment']" />
        </SidebarMenu>
        <!-- <SidebarMenu
        v-for="(menuOption, k) of menuOptions"
        :title="(k as string)"
        class="mt-10"
      >
          <SidebarItems :menuOption="menuOptions['IPFS Identities']" />
      </SidebarMenu> -->
    </div>
  </div>
</template>
