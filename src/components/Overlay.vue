<template>
  <Teleport v-bind = "$attrs" :to="to">
    <div
      v-if="isActive"
      class="bg-black absolute text-white z-40 top-0 left-0 bg-opacity-40"
      :style="{
        minHeight: '99%',
        minWidth: '99%',
      }"
    >
      <div
        class="flex-flex-col absolute z-50 top-1/4 left-1/4 right-1/4 mx-auto bg-gray-500 p-10 rounded-2xl bg-opacity-90"
        v-bind="$attrs"
      >
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useStore } from "@/stores";
import { reactive } from "vue";

const store = reactive(useStore());
withDefaults(defineProps<{ isActive: boolean; to?: string }>(), {
  to: "#popup-target",
});
</script>
