<template>
  <div @click="onClick" class=" transition-colors hover:text-h-hover-text"
    :class="active ? 'text-h-hover-text' : 'text-white'">
      <slot></slot>
    </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  onClick?: (e: any) => void,
  active?: boolean
}>(), {
  active: false
})
</script>