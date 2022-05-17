<script lang="ts" setup>
import LoadingOverlayVue from "@/components/LoadingOverlay.vue";
import type { Video } from "@/interface";
import { useStore } from "@/stores";
import api from "@/utils/request";
import { ref, watchEffect } from "vue";
import Render from "@/components/RenderObject";
import EnhancedSpanVue from "@/components/EnhancedSpan.vue";
import { IpfsStorage } from "@/utils/ipfs/utils";
const store = useStore();
const videos = ref<Video[]>([]);
const ipfsVideos = ref<any[]>([]);
async function fetchVideo(channelId: number) {
  loading.value = true;
  try {
    const { data } = await api.get<Video[]>(`/channels/${channelId}/videos`);
    videos.value = data;
    const promises: unknown[] = [];
    for (const video of data) {
      if (video.videoCid) {
        promises.push(
          IpfsStorage.getInstance().getFileUsingGateway(video.videoCid!)
        );
      }
    }
    const ipVS = await Promise.all(promises);
    ipVS.forEach((d) => {
      console.log(d);
      
      ipfsVideos.value.push((d as any)["data"]);
    });
  } catch (err) {
    console.log(err);
  }
  loading.value = false;
}

const loading = ref(false);

watchEffect(() => {
  if (store.hasChannel) {
    fetchVideo(store.getChannelId);
  }
});
</script>

<template>
  <div v-if="store.hasChannel">
    <!-- User Channel exists -->
    <LoadingOverlayVue :is-active="loading" loading-text="Loading Videos From IPFS" :size="24" />
    <div v-if="ipfsVideos.length! > 0">
      <Render
        v-for="message in ipfsVideos"
        class="mb-6"
        :obj="message"
        :objName="message.name"
        :index="1"
      />
    </div>
    <!-- User Channel does not exists but has DI -->
    <div
      v-else
      class="flex flex-col items-center justify-center h-full relative gap-y-10"
    >
      <div class="text-gray-400 font-medium text-lg text-center">
        <div>
          You currently any do not videos published on ipfs
          <EnhancedSpanVue>Decentralised Channel !!</EnhancedSpanVue>
        </div>
      </div>
    </div>
  </div>
  <!-- User Channel does not exist and No DI -->
  <div v-else class="text-gray-400 font-medium text-xl text-center">
    <div>You currently do not have a channel</div>
    <div>Cannot view videos without channel</div>
  </div>
</template>
