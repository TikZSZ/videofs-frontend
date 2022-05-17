<script lang="ts" setup>
import LoadingOverlayVue from "@/components/LoadingOverlay.vue";
import type { Video } from "@/interface";
import { useStore } from "@/stores";
import api from "@/utils/request";
import { ref, watchEffect } from "vue";
import Render from "@/components/RenderObject";
import EnhancedSpanVue from "@/components/EnhancedSpan.vue";
import { IpfsStorage } from "@/utils/ipfs/utils";
import { MediaPlayer } from "dashjs";
import VideoVue from "@/components/Video.vue";

let player = MediaPlayer().create();

const playerRef = ref(null);

const selectedVideo = ref<
  Video & { videoToken: { fileName: string }; src: string }
>();

const store = useStore();
const videos = ref<(Video & { videoToken: { fileName: string } })[]|null>(null);

async function fetchVideo(channelId: number) {
  loading.value = true;
  try {
    videos.value = []
    const { data } = await api.get<
      (Video & { videoToken: { fileName: string } })[]
    >(`/channels/${channelId}/videos`);
    for (const video of data) {
      if (video.ipfsLocation) {
        videos.value.push(video);
        const fileName = video.videoToken.fileName;
      }
    }
    selectVideo(videos.value.length-1);
  } catch (err) {
    console.log(err);
  }
  loading.value = false;
}

const src = ref("");

const loading = ref(false);

watchEffect(() => {
  if (store.hasChannel) {
    fetchVideo(store.getChannelId);
  }
});

function initPlayer(url: string) {
  player.initialize(document.getElementById("videoPlayer")!, url, true);
}

function getGateWayUrl(cid: string, path?: string) {
  if (path) {
    return `https://${cid}.ipfs.dweb.link/${path}`;
  }
  return `https://${cid}.ipfs.dweb.link`;
}

function selectVideo(index: number) {
  window.scrollTo({ top: 0 });
  const video = videos.value!.find((val, i) => {
    return i === index;
  });
  const fileName = video!.videoToken.fileName!;
  const url = getGateWayUrl(
    video!.ipfsLocation!,
    `${fileName.substring(fileName.length - 4, 0)}.mpd`
  );
  console.log({ video, url });

  selectedVideo.value = { ...video!, src: url };
  initPlayer(url);
}

</script>

<template>
  <div v-if="store.hasChannel">
    <LoadingOverlayVue  :is-active="!videos" />
    <div v-if="videos && videos.length === 0">
      You do not have any videos
    </div>
    <div v-if="videos && videos.length > 0" class="flex transition-all will-change-scroll relative flex-col lg:flex-row w-full min-h-[90vh] mx-auto mt-10">
    <!-- Video Player -->
    <div class="basis-full top-0 relative">
      <div class="relative w-[96%]" v-if="selectedVideo && selectedVideo.src">
        <video
          ref="playerRef"
          class="relative w-[100%] top-0 right-0"
          id="videoPlayer"
          data-dashjs-player
          autoplay
          controls
        ></video>
        <div class="mt-5 relative">
          <h1 class="text-2xl font-bold">Description</h1>
          <hr class="border-gray-700 mt-1 top-[3.8rem]" />
          <div class="relative">
            <div class="relative my-3">
              <div class="text-lg">{{ selectedVideo.name }}</div>
              <div
                v-if="selectedVideo.uploadedAt"
                class="absolute top-6 text-slate-500 text-sm"
              >
                Uploaded On
                <span class="text-sky-500">{{
                  new Date(selectedVideo.uploadedAt).toLocaleString()
                }}</span>
              </div>
            </div>
            <hr class="border-gray-700 mt-8 mb-4" />
            <div>
              <div class="text-gray-400 whitespace-pre-line">
                {{ selectedVideo.description }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>{{}}</div>
    </div>
    <!-- Videos -->
    <div class="flex relative -op-2 flex-col gap-y-5 lg:basis-1/2">
      <div
        class="flex gap-x-4 flex-row relative cursor-pointer transition-all hover:bg-gray-800 rounded-md py-1"
        v-for="(video, index) in videos"
        @click="selectVideo(index)"
      >
        <img
          class="relative w-1/3 lg:w-1/2 rounded-sm"
          :src="getGateWayUrl(video.ipfsLocation!,`${video.videoToken.fileName.substring(video.videoToken.fileName.length-4,0)}.jpeg`)"
          alt=""
        />
        <div class=" relative w-1/2 -mt-1 ">
         <div>{{video.name}}</div>
         <div class="text-xs text-gray-400 mt-2">{{new Date(video.uploadedAt).toTimeString()}}</div>
        </div>
      </div>
    </div>
  </div>
  </div>
  <div v-else>
    You Do not have a channel!!
  </div>
</template>
