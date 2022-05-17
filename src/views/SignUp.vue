<script setup lang="ts">
import Form from "@/components/Form.vue";
import FormInput from "@/components/FormInput.vue";
import { useStore } from "@/stores";
import api from "@/utils/request";
import { PrivateKey } from "@hashgraph/sdk";
import { Buffer } from "buffer";
import type { LoginReq, TokenResponse, UserEntity } from "@/interface";
import { useRouter } from "vue-router";
import signature from "@/utils/crypto/signature";
import { wallet } from "@/utils/wallet";
import { privKey } from "@/env";

const fields = [
  {
    label: "KeyType",
    name: "type",
  },
  {
    label: "Key",
    name: "key",
  },
  {
    label: "Name",
    name: "name",
  },
];

const store = useStore();

interface SignUp {
  signature: string;
  key: string;
  keyType: string;
  name: string;
}
const router = useRouter();

function getSignedPayload(payload: TokenResponse): LoginReq {
  return {
    serverSignature: payload.token.serverSig,
    originalPayload: payload.token.payload,
  };
}

async function submit(submitedData: Omit<SignUp, "signature">) {
  const { keyType, key, name = "aditya" } = submitedData;
  try {
    // generate a token for user
    const { data } = await api.post<TokenResponse>(
      `/users/${store.selectedAccount}/token`
    );

    const signedPayload = getSignedPayload(data);
    await wallet.authenticate({
      accountToAuthenticate: store.selectedAccount,
      serverAccountId: store.selectedAccount,
      payload: signedPayload.originalPayload,
      serverSig: signedPayload.serverSignature,
    });
    // register the user
    const { data: user } = await api.post<UserEntity>(
      `/users/${store.selectedAccount}/signup`,
      {
        data: {
          name,
          signedPayload,
          signature: signature(privKey, signedPayload, "utf8").base64Signature,
        },
      }
    );
    if (user) {
      store.setUser(user);
      router.push({ name: "home" });
    }
  } catch (err) {}
}
</script>

<template>
  <div class="absolute div w-1/2 left-1/4 top-1/4">
    <Form formTitle="SignUp" buttonText="Submit" :submit="submit">
      <FormInput label="Name" name="name" />
    </Form>
  </div>
</template>
