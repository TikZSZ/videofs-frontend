<template>
  <div
    class="flex flex-rows gap-x-10 justify-center mt-2 absolute right-1/4 top-1/4"
  >
    <NavLinks
      :onClick="
        () => {
          router.push({
            path: '/signup',
          });
        }
      "
      :active="isActive('/signup')"
      v-if="!store.isLoggedIn && store.isWalletConnected && !store.isRegistered"
    >
      SignUp
    </NavLinks>
    <NavLinks
      :onClick="login"
      v-if="!store.isLoggedIn && store.isWalletConnected && store.isRegistered"
    >
      SignIn
    </NavLinks>
    <DynamicTextVue
      v-else-if="store.user && store.user.authAccountId"
      :text="store.user.name"
      hoverText="Logout"
      @click="logout"
    />
  </div>
</template>

<script setup lang="ts">
import { useStore } from "@/stores";
import { useRoute, useRouter } from "vue-router";
import DynamicTextVue from "../DynamicText.vue";
import NavLinks from "./NavItems.vue";
import type { LoginReq, TokenResponse, UserEntity } from "@/interface";
import api from "@/utils/request";
import { signature } from "@/utils/crypto/signature";
import {privKey} from "@/env"
defineProps<{ isActive: Function }>();

const authRoutes = [
  {
    name: "SignUp",
    path: "/signup",
  },
  {
    name: "SignIn",
    path: "/signin",
  },
];
const store = useStore();
const router = useRouter();
const route = useRoute();
async function logout() {
  await store.logout();
  if (route.meta && route.meta.requiresAuth) {
    router.push("/");
  }
}

function getSignedPayload(payload: TokenResponse): LoginReq {
  return {
    serverSignature: payload.token.serverSig,
    originalPayload: payload.token.payload,
  };
}

async function login() {
  let selectedAccount = store.selectedAccount;

  const { data } = await api.get<TokenResponse>(
    `/users/${selectedAccount}/token`
  );
   const signedPayload = getSignedPayload(data)
  const { data: userResp } = await api.post<UserEntity>(
    `/users/${selectedAccount}/login`,
    {
      data: {
        signature: signature(privKey,signedPayload,"utf8").base64Signature,signedPayload
      },
    }
  );
  store.setUser(userResp);
}
</script>
