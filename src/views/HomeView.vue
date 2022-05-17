<script setup lang="ts">
import Form from '@/components/Form.vue';
import FormInput from '@/components/FormInput.vue';
import { useStore } from '@/stores';
import {main as m} from "@/utils/SmartContracts/smartcontract"
import { PublicKey } from '@hashgraph/sdk';

import { onMounted, ref } from 'vue';
const name = ref("")
function update(val: string) {
  name.value = val
}
const store = useStore()


function submit(val: { Name: string, password: string }) {
  console.log(val.Name);
}


</script>

<template>
  <div class="absolute div w-1/2 left-1/4 top-1/4">
    <div class="text-6xl text-gray-500">Welcome to VideoFS</div>
  </div>
</template>
