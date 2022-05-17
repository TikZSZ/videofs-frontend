<template>
  <button class="bg-slate-700 hover:bg-slate-600 
  transition-colors w-32 h-10 rounded-3xl 
  text-h-text
  "
  >
    {{text}}
  </button>
</template>

<script  setup lang="ts">
const props = defineProps<{
  text:string,
}>()
</script>