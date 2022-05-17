<script lang="ts" setup>
import FormVue from "@/components/Form.vue";
import FormInputVue from "@/components/FormInput.vue";
import type { Video as V, VideoToken } from "@/interface";
import { useStore } from "@/stores";
import api from "@/utils/request";
import { ref, watchEffect } from "vue";
import FormFileInput from "@/components/FormFileInput.vue";
import UploadedVideoVue from "@/components/UploadedVideo.vue";
import VideoVue from "@/components/Video.vue";
import { randombytes_random, randombytes_stir } from "libsodium-wrappers";
import LoadingOverlayVue from "@/components/LoadingOverlay.vue";
import ButtonVue from "@/components/Button.vue";
const store = useStore();

type Video = V & { videoToken: VideoToken };

const CHUNK_SIZE = 1024 * 5;

const fileList = ref();

const uploadTasks = ref<{
  [k: number]: {
    name?: string;
    description?: string;
    progress?: number;
    paused?: boolean;
    file?: File;
    channelId?: number;
  };
}>({});

const formKey = ref<number>(0);

const videos = ref<Video[]>();

async function fetchVideo(channelId: number) {
  const { data } = await api.get<Video[]>(`/channels/${channelId}/videos`);
  videos.value = data;
}

watchEffect(() => {
  if (store.hasChannel) {
    fetchVideo(store.getChannelId);
  }
});

const submittingForm = ref(false);

function getChunks(size: number, chunkSize: number) {
  return Math.floor((size + 1) / chunkSize);
}

function prepFormData(file: Blob, start: number, end: number) {
  return new Promise((res, rej) => {
    const fileReader = new FileReader();
    fileReader.onloadend = (e) => {
      const data = e.target!.result!.slice(start, end) as ArrayBuffer;
      const formData = new FormData();
      const dataBlob = new Blob([data]);
      formData.append("file", dataBlob, "file");
      res(formData);
    };
    fileReader.readAsArrayBuffer(file);
  });
}

function updateProgress(id: number, progress: number) {
  console.log(progress);

  uploadTasks.value[id].progress = progress;
}

async function cancelUpload(id: number) {
  uploadTasks.value[id] = {
    ...uploadTasks.value[id],
    paused: true,
  };
}

async function resumeUpload(id: number) {
  uploadTasks.value[id] = {
    ...uploadTasks.value[id],
    paused: false,
  };
  const { file, channelId } = uploadTasks.value[id];
  upload(file!, id, channelId!);
}

async function upload(file: File, videoId: number, channelId: number) {
  try {
    const {
      data: { videoToken: tokenResp, ...rest },
    } = await api.get<Video>(`/channels/${channelId}/videos/${videoId}`);
    if (tokenResp.completed)
      throw new Error("cannot upload a video thats already been uploaded");
    // if (!(tokenResp.id && typeof tokenResp.uploadedSize === "number"))
    //   throw new Error("invalid token");
    console.log(tokenResp);

    const totalChunks = getChunks(file.size, CHUNK_SIZE);
    let uploadedChunks = getChunks((rest as any).uploadedSize, CHUNK_SIZE);
    uploadedChunks = uploadedChunks === 0 ? 0 : uploadedChunks;
    if (!uploadTasks.value[videoId]) {
      uploadTasks.value[videoId] = {
        name: rest.name,
        description: rest.description,
        paused: false,
        progress: 0,
        file: file,
        channelId: channelId,
      };
    }
    console.log(uploadedChunks);

    for (let i = uploadedChunks; i < totalChunks; i++) {
      console.log({ uploadedChunks, totalChunks, i });
      if (uploadTasks.value[videoId].paused) {
        console.log("breaked");
        throw new Error("video paused");
      } else {
        const start = i * CHUNK_SIZE;
        const end = i + 1 === totalChunks ? file.size : (i + 1) * CHUNK_SIZE;
        console.log(start, end);

        const formBody = await prepFormData(file, start, end);
        console.log(formBody);
        updateProgress(videoId, end / file.size);
        await api.post(`/channels/${channelId}/videos/${videoId}`, formBody, {
          headers: {
            "Content-Range": `bytes=${start}-${end}/${file.size}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }
    }
    delete uploadTasks.value[videoId];
    videos.value!.unshift({ ...(rest as any), completed: true });
  } catch (err) {
    console.log(err);
  }
}

async function submit(data: {
  video: FileList;
  name: string;
  description: string;
}) {
  submittingForm.value = true;
  try {
    if (!store.hasChannel) throw new Error("no channel");
    // gather all data needed to start uploading the file
    const { fileName, fileSize } = parseFile(data.video);
    // create video
    const { data: videoResp } = await api.post<Video>(
      `/channels/${store.getChannelId!}/videos`,
      {
        data: {
          name: data.name,
          description: data.description,
          videoMeta: {
            fileName,
            fileSize,
          },
        },
      }
    );
    submittingForm.value = false;
    // start uploading video with formdata
    upload(data.video[0], videoResp.id, store.getChannelId);
    formKey.value = randombytes_random();
  } catch (err) {
    console.log(err);
  }
}

function updateVideo(video: any, id: number) {
  console.log(video,id);
  
  const videoIndex = videos.value!.findIndex((v) => {
    return v.id === id;
  });

  console.log(videoIndex);
  
  if (videoIndex) {
    videos.value![videoIndex]['videoCid'] = video.videoCid
  }
}

function parseFile(file: FileList) {
  if (!file[0]) throw new Error("no files found");
  const f = file[0];
  const fileSize = f.size;
  const fileName = f.name;
  return { fileSize, fileName };
}
</script>

<template>
  <div class="transition-all">
    <div v-for="(task, id) in uploadTasks">
      <div :key="id">
        <VideoVue :video="(task as any)">
          <div
            class="h-6 bg-gray-300 relative rounded-full text-center transition-all"
          >
            <div
              class="h-6 absolute top-0 rounded-full transition-all bg-sky-600"
              :style="{width:`${(Math.ceil(task.progress!*100))}%`}"
            >
              <span
                class="text-white"
                >{{task.paused?"Paused":(Math.round(task.progress!*100))+"%"}}</span
              >
            </div>
          </div>
          <ButtonVue v-if="!task.paused" @click="cancelUpload(id)" text="Pause"
            >Pause</ButtonVue
          >
          <ButtonVue v-else @click="resumeUpload(id)" text="Resume"
            >Resume</ButtonVue
          >
        </VideoVue>
      </div>
    </div>
    <div class="min-w-max relative">
      <FormVue
        formTitle="Upload Video"
        :key="formKey"
        :submit="submit"
        buttonText="Upload"
        class="relative"
      >
        <FormInputVue label="Name" :required="true" name="name"></FormInputVue>
        <FormInputVue
          label="Description"
          :required="true"
          class="whitespace-pre-line"
          name="description"
          type="textarea"
        ></FormInputVue>
        <FormFileInput name="video" v-slot="{ files }">
          <UploadedVideoVue :files="files" />
        </FormFileInput>
      </FormVue>
    </div>
    <div class="mt-5" v-if="videos && videos.length > 0">
      <h1 class="text-4xl text-center">Videos</h1>
      <VideoVue :updateVideo="updateVideo" :video="video" :key="video.id" v-for="video of videos" />
    </div>
    <LoadingOverlayVue
      :is-active="submittingForm"
      loading-text="Uploading Video To Server..."
    />
  </div>
</template>
