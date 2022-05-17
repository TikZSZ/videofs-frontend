<script lang="ts" setup>
import { computed, ref, type InputHTMLAttributes } from "vue";

export interface Props {
  label: string;
  value?: string;
  name: string;
  update?: (val: any) => void;
  disabled?: boolean;
  required?:boolean;
  type?:InputHTMLAttributes['type']
}

const props = defineProps<Props>();
const isFocused = ref(false);
const show = computed(() => {
  return isFocused.value ? false : !props.value ? true : false;
});

defineEmits<{
  (e: "update", value: any): void;
}>();
</script>

<template>
  <div class="flex flex-col relative">
    <label
      :for="label"
      class="text-gray-100 top-2 left-4 transition-all font-medium"
      :class="show ? ' text-gray-100' : ' text-sky-700'"
      v-bind="$attrs"
    >
      {{ label }}<span class="text-red-500" v-if="required">*</span>
    </label>
    <input
      class="rounded-lg focus:bg-sky-700 bg-slate-700 outline-none px-5 py-2 text-gray-100 placeholder-gray-100 transition-all"
      @focusin.capture="isFocused = true"
      @focusout.capture="isFocused = false"
      :class="show ? ' placeholder-opacity-100' : 'placeholder-opacity-0 '"
      @input="
        (e) => {
          //@ts-ignore
          update(e.target.value);
        }
      "
      :value="value"
      :readonly="disabled"
      :required="required"
      :type="type as any"
    />
  </div>
</template>
