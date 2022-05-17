<script lang="ts" setup>
defineProps<{
  title:string
}>()
</script>


<template>
  <div class="text-sm font-medium " v-bind="$attrs">
    <div class="text-white">
      {{title}}
    </div>
  </div>
    <div class=" my-4 ">
      <slot></slot>
    </div>
</template>