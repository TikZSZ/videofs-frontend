<script lang="tsx" setup>
import ButtonVue from "@/components/Button.vue";
import EnhancedSpanVue from "@/components/EnhancedSpan.vue";
import FormVue from "@/components/Form.vue";
import FormInputVue from "@/components/FormInput.vue";
import LoadingOverlayVue from "@/components/LoadingOverlay.vue";
import type { DI, UserEntity } from "@/interface";
import { useStore } from "@/stores";
import signature from "@/utils/crypto/signature";
import { IpfsStorage } from "@/utils/ipfs/utils";
import api from "@/utils/request";
import { h, reactive, ref, watch, watchEffect } from "vue";
import type { CIDString } from "web3.storage";
import Render from "@/components/RenderObject";
import { privKey } from "@/env";

const store = reactive(useStore());

const ipfsInstance = IpfsStorage.getInstance();

function getDIFileName(accountId: string, mode: number = 0) {
  return `${accountId}-${mode}.json`;
}

const progress = ref(0);

function onProgress(size: number, pct: number) {
  console.log({ size, pct });
  progress.value = pct;
}


const creatingDI = ref(false);
const submittingForm = ref(false);

const di = ref<DI>();

function getDIMetadata(user: UserEntity): DI["metadata"] {
  const { authAccountId, key, keyType } = user;

  return {
    accountID: authAccountId,
    key: {
      key,
      keyType,
    },
    network: "Hedera",
    networkType: "Testnet",
    encoding: "base64",
  };
}

const loadingDI = ref(false);

async function createDI({ name }: { name: string }) {
  submittingForm.value = true;
  try {
    // get currently logged in user
    const user = store.user;
    if (!user) throw new Error("Not authorized");
    // get DI Metadata
    const diMetadata = getDIMetadata(user);

    // sign DI metadata
    const { base64Signature } = signature(privKey, diMetadata);

    // prep DI Object
    const diObject: DI = {
      metadata: diMetadata,
      signature: base64Signature,
    };
    // convert it to a file
    const objectFile = ipfsInstance.getObjectFile(
      diObject,
      getDIFileName(user.authAccountId)
    );

    // upload the DI to ipfs
    const diCid = await ipfsInstance.storeFilesWithProgress(
      [objectFile],
      { wrapWithDirectory: false },
      onProgress
    );
    // update the user auth with DICID
    const { data } = await api.post<{ diCid: string }>(
      `/users/${store.user!.authAccountId}/di`,
      {
        data: {
          diCid,
        },
      }
    );
    store.setUser({ ...user, diCid: data.diCid });
  } catch (err) {}
  creatingDI.value = false;
  submittingForm.value = false;
}

async function fetchDI(cid: CIDString) {
  loadingDI.value = true;
  const { data } = await ipfsInstance.getFileUsingGateway(cid);
  di.value = data;
  loadingDI.value = false;
}

if (store.hasDI) {
  fetchDI(store.user?.diCid!);
}

watchEffect(
  () => {
    if(store.hasDI){
      fetchDI(store.user!.diCid!);
    }
  }
);
</script>

<template>
  <div v-if="store.hasTopic">
    <div v-if="store.hasDI">
      <LoadingOverlayVue loading-text="Loading DI from ipfs..." :is-active="loadingDI" :size="24" />
      <div v-if="di">
        <Render
          :obj="di"
          objName="Decentralised Identity"
          :cid="`${store.user?.diCid}`"
          :index="1"
        />
      </div>
    </div>
    <div
      v-else
      class="flex flex-col items-center justify-center h-full relative gap-y-10"
    >
      <div v-if="creatingDI">
        <FormVue
          formTitle="Create DI"
          buttonText="Submit"
          :submit="createDI"
          
        >
          <FormInputVue label="Name for DI" :required="true" name="name"></FormInputVue>
        </FormVue>
      </div>
      <div v-else class="text-gray-400 font-medium text-lg text-center">
        <div>
          You currently do not have a
          <EnhancedSpanVue>Decentralised Identity !!</EnhancedSpanVue>
        </div>
        <div>
          Create one to enter into
          <EnhancedSpanVue> Web 3 </EnhancedSpanVue> content patform
        </div>
      </div>
      <ButtonVue
        text="Create DI"
        v-if="!creatingDI"
        @click="creatingDI = true"
      />
      <LoadingOverlayVue loading-text="Creating Decentralised identity..." :is-active="submittingForm" :size="24" />
    </div>
  </div>
  <div v-else class="text-gray-400 font-medium text-xl text-center">
    <div>
      You currently do not have a
      <router-link to="/dashboard/topic">
        <EnhancedSpanVue>Topic !!</EnhancedSpanVue>
      </router-link>
    </div>
    <div>
      Cannot create DI without Topic
    </div>
  </div>
</template>
