<template>
  <div
    class="border-h-text text-h-text hover:bg-sky-600 hover:border-sky-600 border-2 px-3 rounded-xl uppercase font-medium relative cursor-pointer transition-all"
    @mouseenter="showHoverText = true"
    @mouseleave="showHoverText = false"
  >
    {{ !showHoverText ? text : hoverText }}
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const hoverText = "LogOut";
let showHoverText = ref(false);
defineProps<{text:string,hoverText:string}>()
</script>
