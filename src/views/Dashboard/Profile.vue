<script lang="ts" setup>
import ButtonVue from "@/components/Button.vue";
import EnhancedSpanVue from "@/components/EnhancedSpan.vue";
import FormVue from "@/components/Form.vue";
import FormInputVue from "@/components/FormInput.vue";
import LoadingOverlayVue from "@/components/LoadingOverlay.vue";
import type { DI, UserEntity, UserMetadata } from "@/interface";
import { useStore } from "@/stores";
import signature from "@/utils/crypto/signature";
import { IpfsStorage } from "@/utils/ipfs/utils";
import api from "@/utils/request";
import { computed, h, ref, watch, watchEffect } from "vue";
import type { CIDString } from "web3.storage";
import Render from "@/components/RenderObject";
import { privKey } from "@/env";

const store = useStore();

const ipfsInstance = IpfsStorage.getInstance();

function getProfileFileName(name: string, date: string) {
  return `${name}-${date}.json`;
}


const creatingProfile = ref(false);
const submittingForm = ref(false);

const profile = ref<UserMetadata>();

const name = "Profile";


const loading = ref(false);

type Metadata = UserMetadata["metadata"];

function getProfileMetadata(data: FormData, diCid: string): Metadata {
  const { email, phoneNumber, socials, age, dob } = data;
  const time = new Date().toUTCString();
  return {
    name: data.name,
    createdAt: time,
    decentralisedIdentity: diCid,
    location: {
      country: data.country,
      state: data.state,
    },
    personalInfo: {
      email,
      phoneNumber,
      socials,
      age,
      dob,
    },
  };
}

async function createProfile(submittedData: FormData) {
  submittingForm.value = true;
  try {
    // get currently logged in user
    const user = store.user;
    if (!user) throw new Error("Not authorized");

    const metadata = getProfileMetadata(submittedData, user.diCid!);
    // sign DI metadata
    const { base64Signature } = signature(privKey, metadata);

    // prep DI Object
    const diObject: UserMetadata = {
      metadata: metadata,
      signature: base64Signature,
    };
    // convert it to a file
    const objectFile = ipfsInstance.getObjectFile(
      diObject,
      getProfileFileName(metadata.name, metadata.createdAt)
    );

    // upload the DI to ipfs
    const userCid = await ipfsInstance.storeFilesWithProgress([objectFile], {
      wrapWithDirectory: false,
    });
    // update the user auth with DICID
    const { data } = await api.put<{ userCid: string }>(
      `/users/${store.user!.authAccountId}`,
      {
        data: {
          userCid,
        },
      }
    );
    store.setUser({ ...user, userCid: data.userCid });
  } catch (err) { }
  creatingProfile.value = false;
  submittingForm.value = false;
}

async function fetchProfile(cid: CIDString) {
  loading.value = true;
  const { data } = await ipfsInstance.getFileUsingGateway(cid);
  profile.value = data;
  loading.value = false;
}

type FormData = Pick<Metadata, "name"> &
  Metadata["personalInfo"] &
  Metadata["location"];

watchEffect(
  () => {
    if (store.hasUserCid) {
      fetchProfile(store.user!.userCid!)
    }
  }
);
</script>

<template>
  <div v-if="store.hasDI">
    <!-- User Profile exists -->
    <div v-if="store.hasUserCid">
      <LoadingOverlayVue :is-active="loading" loading-text="Loading IPFS profile..." :size="24" />
      <div v-if="profile">
        <Render :obj="profile" :objName="name" :cid="store.user!.userCid" :index="1" />
      </div>
    </div>
    <!-- User Profile does not exists but has DI -->
    <div v-else class="flex flex-col items-center justify-center h-full relative gap-y-10">
      <div v-if="creatingProfile" class="w-11/12">
        <FormVue formTitle="Create Profile" buttonText="Submit" :submit="createProfile">
          <FormInputVue label="Name" :required="true" name="name"></FormInputVue>
          <FormInputVue label="Country" :required="false" name="country"></FormInputVue>
          <FormInputVue label="State" :required="false" name="state"></FormInputVue>
          <FormInputVue label="Age" :required="false" name="age"></FormInputVue>
          <FormInputVue label="Date of Birth" :required="false" name="dob" type="datetime-local"></FormInputVue>
          <FormInputVue label="Email" :required="false" name="email" type="email"></FormInputVue>
          <FormInputVue label="PhoneNumber" :required="false" name="phoneNumber" type="tel"></FormInputVue>
          <FormInputVue label="socials" :required="false" name="Socials"></FormInputVue>
        </FormVue>
        <LoadingOverlayVue loading-text="Creating IPFS Profile..." :is-active="submittingForm" :size="24" />
      </div>
      <div v-else class="text-gray-400 font-medium text-lg text-center">
        <div>
          You currently do not have a
          <EnhancedSpanVue>Decentralised Profile !!</EnhancedSpanVue>
        </div>
        <div>
          Create one to enter into
          <EnhancedSpanVue> Web 3 </EnhancedSpanVue> content patform
        </div>
        <ButtonVue :text="`Create ${name}`" v-if="!creatingProfile" @click="creatingProfile = true" />
      </div>
    </div>

  </div>
  <!-- User Profile does not exist and No DI -->
  <div v-else class="text-gray-400 font-medium text-xl text-center">
    <div>
      You currently do not have a
      <router-link to="/dashboard/decentralised-identity">
        <EnhancedSpanVue>Decentralised Identity !!</EnhancedSpanVue>
      </router-link>
    </div>
    <div>
      Cannot create Profile without DI
    </div>
  </div>
</template>
