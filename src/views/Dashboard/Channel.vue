<script lang="ts" setup>
import ButtonVue from "@/components/Button.vue";
import EnhancedSpanVue from "@/components/EnhancedSpan.vue";
import FormVue from "@/components/Form.vue";
import FormInputVue from "@/components/FormInput.vue";
import LoadingOverlayVue from "@/components/LoadingOverlay.vue";
import type {
  ChannelMetadata,
  DI,
  UserEntity,
  UserMetadata,
} from "@/interface";
import { useStore } from "@/stores";
import signature from "@/utils/crypto/signature";
import { IpfsStorage } from "@/utils/ipfs/utils";
import api from "@/utils/request";
import { computed, h, ref, watch, watchEffect } from "vue";
import type { CIDString } from "web3.storage";
import Render from "@/components/RenderObject";
import { getSendMsgTxn } from "@/utils/util";
import { wallet } from "@/utils/wallet";
import { TransactionReceipt } from "@hashgraph/sdk";
import { privKey } from "@/env";
const store = useStore();

const ipfsInstance = IpfsStorage.getInstance();

function getChannelFileName(name: string, date: string) {
  return `${name}-${date}.json`;
}


const creatingChannel = ref(false);
const submittingForm = ref(false);

const channel = ref<ChannelMetadata>();

const name = "Channel";

const loading = ref(false);

type Channel = {
  id: number;
  name: string;
  createdAt: string;
  description: string;
  socials: string;
  channelCid: string;
};

type Metadata = ChannelMetadata["metadata"];

function getChannelMetadata(
  data: FormData,
  userData: {
    userIdentity: string;
    topicId: string;
    decentralisedIdentity: string;
  }
): Metadata {
  const time = new Date().toUTCString();
  return {
    ...data,
    createdAt: time,
    ...userData,
  };
}

async function createChannel(submittedData: FormData) {
  submittingForm.value = true;
  try {
    // get currently logged in user
    const user = store.user;
    if (!user) throw new Error("Not authorized");

    const { diCid, topicId, userCid } = user;
    const channelMetadata = getChannelMetadata(submittedData, {
      userIdentity: userCid!,
      decentralisedIdentity: diCid!,
      topicId: topicId!,
    });

    // sign channel metadata
    const { base64Signature } = signature(privKey, channelMetadata);

    // prep channel Object
    const diObject: UserMetadata = {
      metadata: channelMetadata,
      signature: base64Signature,
    };
    // convert it to a file
    const objectFile = ipfsInstance.getObjectFile(
      diObject,
      getChannelFileName(channelMetadata.name, channelMetadata.createdAt)
    );

    // upload the channel to ipfs
    const channelCid = await ipfsInstance.storeFilesWithProgress([objectFile], {
      wrapWithDirectory: false,
    });
    // upload the channel to topic
    const sendMsgTxn = getSendMsgTxn(
      diObject,
      topicId!,
      store.selectedAccount!
    );

    const resp = await wallet.sendTransaction(sendMsgTxn, {
      accountToSign: store.selectedAccount,
      getRecord: true,
      returnTransaction: false,
    });
    if (resp.success) {
      // update the user with topic
      const { data } = await api.post<Channel>(`/channels`, {
        data: {
          name: channelMetadata.name,
          channelCid,
          description: channelMetadata.description,
          socials: channelMetadata.socials,
          createdAt: channelMetadata.createdAt,
        },
      });
      store.setUser({ ...user, channel: { ...data } });
    } else {
      throw new Error(resp.error);
    }
    // create the channel
  } catch (err) {}
  creatingChannel.value = false;
  submittingForm.value = false;
}

async function fetchChannel(cid: CIDString) {
  loading.value = true;
  const { data } = await ipfsInstance.getFileUsingGateway(cid);
  channel.value = data;
  loading.value = false;
}

type FormData = Omit<
  ChannelMetadata["metadata"],
  "topicID" | "decentralisedIdentity" | "userIdentity" | "createdAt"
>;

watchEffect(() => {
  if (store.hasChannelCid) {
    fetchChannel(store.user!.channel!.channelCid!);
  }
});
</script>

<template>
  <div v-if="store.hasUserCid">
    <!-- User Channel exists -->
    <div v-if="store.hasChannelCid">
      <LoadingOverlayVue :is-active="loading" loading-text="Loading IPFS channel..." :size="24" />
      <div v-if="channel">
        <Render
          :obj="channel"
          :objName="name"
          :cid="store.user!.userCid"
          :index="1"
        />
      </div>
    </div>
    <!-- User Channel does not exists but has DI -->
    <div
      v-else
      class="flex flex-col items-center justify-center h-full relative gap-y-10"
    >
      <div
        v-if="!store.isWalletConnected"
        class="text-center text-2xl my-2 font-bold text-red-500"
      >
        Wallet not connected please connect wallet
      </div>
      <div v-else>
        <div v-if="creatingChannel" class="w-11/12">
          <FormVue
            formTitle="Create Channel"
            buttonText="Submit"
            :submit="createChannel"
          >
            <FormInputVue
              label="Name"
              :required="true"
              name="name"
            ></FormInputVue>
            <FormInputVue
              label="Description"
              :required="true"
              name="description"
            ></FormInputVue>
            <FormInputVue
              label="Socials"
              :required="false"
              name="socials"
            ></FormInputVue>
          </FormVue>
          <LoadingOverlayVue loading-text="Creating IPFS Channel..." :is-active="submittingForm" :size="24" />
        </div>
        <div v-else class="text-gray-400 font-medium text-lg text-center">
          <div>
            You currently do not have a
            <EnhancedSpanVue>Decentralised Channel !!</EnhancedSpanVue>
          </div>
          <div>
            Create one to enter into
            <EnhancedSpanVue> Web 3 </EnhancedSpanVue> content patform
          </div>
          <ButtonVue
            :text="`Create ${name}`"
            v-if="!creatingChannel"
            @click="creatingChannel = true"
            class="h-full my-4 w-1/2"
          />
        </div>
      </div>
    </div>
  </div>
  <!-- User Channel does not exist and No DI -->
  <div v-else class="text-gray-400 font-medium text-xl text-center">
    <div>
      You currently do not have a
      <router-link to="/dashboard/profile">
        <EnhancedSpanVue>Profile Identity !!</EnhancedSpanVue>
      </router-link>
    </div>
    <div>Cannot create Channel without Profile</div>
  </div>
</template>
