<script lang="ts" setup>
import type { Video as V, VideoMetadata, VideoToken } from "@/interface";
import { useStore } from "@/stores";
import signature from "@/utils/crypto/signature";
import { IpfsStorage } from "@/utils/ipfs/utils";
import api from "@/utils/request";
import { getSendMsgTxn } from "@/utils/util";
import { wallet } from "@/utils/wallet";
import { ref } from "vue";
import ButtonVue from "./Button.vue";
import LoadingOverlayVue from "./LoadingOverlay.vue";
const store = useStore();
type Video = V & { videoToken: VideoToken };

const props = defineProps<{ video: Video, updateVideo?:(video:any,videoId:number) => void }>();

function getVideoMetaData(video: Video): VideoMetadata["metadata"] {
  const { name, description, ipfsLocation } = video;
  const time = new Date().toUTCString();
  return {
    name,
    displayName: name,
    description,
    videoCid: ipfsLocation!,
    uploadedAt: time,
    channelCid: store.getChannelCid,
  };
}

function getVideoFileName(name: string, time: string) {
  return `${name}-${time}.json`;
}

const privKey =
  "302e020100300506032b657004220420b70af9b42cc4a021226bdf936d3c3fa438f14346e4a8db2737817589e8087495";
const ipfsInstance = IpfsStorage.getInstance();

const submittingForm = ref(false);

async function uploadToIpfs(video: Video) {
  submittingForm.value = true;
  try {
    const videoMetadata = getVideoMetaData(video);

    // sign DI metadata
    const { base64Signature } = signature(privKey, videoMetadata);

    // prep DI Object
    const diObject: VideoMetadata = {
      metadata: videoMetadata,
      signature: base64Signature,
    };
    // convert it to a file
    const objectFile = ipfsInstance.getObjectFile(
      diObject,
      getVideoFileName(videoMetadata.name, videoMetadata.uploadedAt)
    );

    // upload the DI to ipfs
    const videoCid = await ipfsInstance.storeFilesWithProgress([objectFile], {
      wrapWithDirectory: false,
    });

    // send to topic

    // upload the channel to topic
    const sendMsgTxn = getSendMsgTxn(
      {
        name:videoMetadata.name,
        channelCid:videoMetadata.channelCid,
        videoCid:videoMetadata.videoCid,
        uploadedAt:videoMetadata.uploadedAt
      },
      store.user!.topicId!,
      store.selectedAccount!
    );

    const resp = await wallet.sendTransaction(sendMsgTxn, {
      accountToSign: store.selectedAccount,
      getRecord: true,
      returnTransaction: false,
    });
    if (resp.success) {
      // update the user with topic
      const { data } = await api.patch<V>(
        `/channels/${store.getChannelId}/videos/${video.id}`,
        {
          data: {
            videoCid: videoCid,
          },
        }
      );
      props.updateVideo!({videoCid},video.id)
      //store.setUser({ ...user, channel: { ...data } });
    } else {
      throw new Error(resp.error);
    }
  } catch (err) {
    console.log(err);
  }
  submittingForm.value = false;

  // update videos component
  //store.setUser({ ...user, diCid: data.diCid });
}
</script>

<template>
  <div v-bind="$attrs" class="relative flex flex-col gap-y-2 bg-slate-800 p-6 rounded-2xl my-3">
    <h1 class="text-2xl font-bold">Description</h1>
    <hr class="border-gray-700 mt-1 absolute w-full left-0 top-[3.8rem]" />
    <div class="relative">
      <div class="relative my-3">
        <div class="text-lg">{{ video.name }}</div>
        <div
          v-if="video.uploadedAt"
          class="absolute top-6 text-slate-500 text-sm"
        >
          Uploaded On
          <span class="text-sky-500">{{
            new Date(video.uploadedAt).toLocaleString()
          }}</span>
        </div>
      </div>
      <hr class="border-gray-700 mt-6 mb-4" />
      <div>
        <div class="text-gray-400 whitespace-pre-line">
          {{ video.description }}
        </div>
      </div>
    </div>
    <slot>
      <div class="absolute top-2 right-10">
        <div v-if="video.ipfsLocation && !video.videoCid">
          <div v-if="!store.isWalletConnected">
            <div class="font-bold text-lg">
              Video Ready to be published to IPFS
            </div>
            <div>
              <div>
                <span class="text-lg font-bold upper text-red-500"
                  >Please connect wallet to publish</span
                >
              </div>
            </div>
          </div>
          <ButtonVue
            text="Publish to IPFS"
            v-else
            @click="uploadToIpfs(video)"
          />
        </div>
        <div v-else-if="video.videoCid">
          <a
            class="font-bold text-sky-500 text-xl cursor-pointer relative top-2 hover:text-h-hover-text"
            :href="`https://${video.videoCid}.ipfs.dweb.link`"
            target="_blank"
            >Video published on IPFS !!</a
          >
        </div>
        <div v-else>
          <div class="font-bold text-lg relative top-2">Video still processing</div>
        </div>
      </div>
    </slot>
  </div>
  <LoadingOverlayVue loading-text="Publishing video to IPFS and Topic..." :is-active="submittingForm" />
</template>
