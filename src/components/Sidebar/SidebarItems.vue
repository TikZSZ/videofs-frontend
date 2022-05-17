<script lang="ts" setup>
import { useStore } from "@/stores";
import { computed, ref, watch, reactive } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
const store = ref(useStore());

function isActive(path?: string) {
  if (!store.value.activePath || !path) return false;
  return store.value.activePath.split("/")[2] === path.split("/")[2];
}

const props = defineProps<{
  menuOption: {
    name: string;
    path?: string;
  }[];
}>();

function onClick(path?: string) {
  if (!path) return;
  router.push({ path });
}
</script>

<template>
  <div
    v-for="(option, i) of menuOption"
    class
    @click="
      () => {
        onClick(option.path);
      }
    "
  >
    <!-- name -->
    <div
      class="leading-6 border-l-4 border- pl-3 text-sm  font-medium cursor-pointer"

      :class="
        isActive(option.path)
          ? 'text-sky-500  border-sky-500 font-semibold '
          : ' hover:text-slate-300 text-slate-400 border-slate-700  hover:border-slate-400'
      "
    >
      {{ option.name }}
    </div>
    <!-- Bottom Line -->
    <div
      v-if="menuOption.length - 1 !== i"
      class="pl-3 border-l-4  h-2 border-slate-700"
    ></div>
  </div>
</template>
