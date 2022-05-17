<script lang="ts" setup>
import ButtonVue from "@/components/Button.vue";
import EnhancedSpanVue from "@/components/EnhancedSpan.vue";
import LoadingOverlayVue from "@/components/LoadingOverlay.vue";
import type { DI, UserEntity, UserMetadata } from "@/interface";
import { useStore } from "@/stores";
import signature from "@/utils/crypto/signature";
import { IpfsStorage } from "@/utils/ipfs/utils";
import api from "@/utils/request";
import { computed, h, reactive, ref, watch, watchEffect } from "vue";
import type { CIDString } from "web3.storage";
import Render from "@/components/RenderObject";
import {
  Client,
  TopicMessages,
  type MessagesResponse,
} from "@tikz/hedera-mirror-node-ts";
import {
  AccountId,
  TopicCreateTransaction,
  TransactionId,
  PublicKey,
  TransactionReceipt,
} from "@hashgraph/sdk";
import { wallet } from "@/utils/wallet";
import { parseConsenusMessages } from "@/utils/crypto/cryptoUtil";
const store = useStore();

const creatingTopic = ref(false);

const parsedMessages = ref<any[] | null>(null);
const name = "Topic";

const loading = ref(false);

function getTopicCreationTransaction(userPubKey:string,accountId:string) {
  const pubKey = PublicKey.fromString(userPubKey);
  return new TopicCreateTransaction()
    .setAdminKey(pubKey)
    .setSubmitKey(pubKey)
    .setAutoRenewAccountId(AccountId.fromString(accountId))
    .setNodeAccountIds([new AccountId(3)])
    .setTransactionId(
      TransactionId.generate(AccountId.fromString(accountId))
    )
    .freeze();
}

const errored = ref(false);
const errorMessage = ref("");

async function createTopic() {
  errored.value = false;
  creatingTopic.value = true;
  try {
    const topicTxn = getTopicCreationTransaction(store.user!.key!,store.selectedAccount);
    const resp = await wallet.sendTransaction(topicTxn, {
      accountToSign: store.selectedAccount,
      getRecord: true,
      returnTransaction: false,
    });
    if (resp.success) {
      const receipt = TransactionReceipt.fromBytes(resp.receipt!);
      if (!receipt.topicId) {
        errored.value = true;
        throw new Error("Something went wrong");
      }
      // update the user with topic
      const { data } = await api.put<UserEntity>(
        `/users/${store.user!.authAccountId}`,
        {
          data: {
            topicId: receipt.topicId.toString(),
          },
        }
      );
      store.setUser({ ...store.user, ...data });
    } else {
      errorMessage.value = resp.error!;
      errored.value = true;
    }
  } catch (err) {
    errorMessage.value = err as any;
    errored.value = true;
  }
  creatingTopic.value = false;
}

const client = new Client("https://testnet.mirrornode.hedera.com");
const msgCursor = TopicMessages.v1(client);
async function fetchTopicMessages(topicId: string) {
  loading.value = true;
  msgCursor.setTopicId(topicId).order("desc").setLimit(20);
  const Messages = await msgCursor.get();
  console.log(Messages["messages"]);
  
  const pMs = parseConsenusMessages(Messages["messages"].reverse());
  console.log(pMs);
  
  parsedMessages.value = pMs;
  loading.value = false;
}

watchEffect(() => {
  if (store.hasTopic) {
    fetchTopicMessages(store.user!.topicId!);
  }
});
</script>

<template>
  <div v-if="errored" class="text-center text-2xl my-2 font-bold text-red-500">
    {{ errorMessage }}
  </div>
  <div>
    <!-- Topic exists -->
    <div v-if="store.hasTopic">
      <LoadingOverlayVue :is-active="loading" loading-text="Loading topic messages..."  :size="24" />
      <div v-if="parsedMessages && parsedMessages.length > 0">
        <Render
          v-for="message in parsedMessages"
          class="mb-6"
          :obj="message"
          :objName="name"
          :index="1"
        />
      </div>
      <div v-else-if="parsedMessages && parsedMessages.length === 0">
        <div
          class="text-center text-2xl my-2 font-bold text-red-500 uppercase"
        >
          No topic messages found
        </div>
      </div>
    </div>
    <!-- Topic does not exist -->
    <div v-else class="text-gray-400 font-medium text-lg text-center">
      <div
        v-if="!store.isWalletConnected"
        class="text-center text-2xl my-2 font-bold text-red-500"
      >
        Wallet not connected please connect wallet
      </div>
      <div>
        You currently do not have a
        <EnhancedSpanVue>Hedera Topic</EnhancedSpanVue>
      </div>
      <div>
        <EnhancedSpanVue
          >Hedera Topic is required in order to continue</EnhancedSpanVue
        >
      </div>
      <div></div>
      <ButtonVue
        :text="`Create ${name}`"
        v-if="!creatingTopic"
        @click="createTopic"
        :disaabled="!store.isWalletConnected"
      />
      <LoadingOverlayVue loading-text="Creating Topic..." :is-active="creatingTopic" :size="24" />
    </div>
  </div>
</template>
