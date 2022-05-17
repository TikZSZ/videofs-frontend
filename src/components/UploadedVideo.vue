<script setup lang="ts">
const props = defineProps<{ files: FileList }>();
console.log(props);

function parseFilename(file: File) {
  return file.name.replace("." + file.type.substring(6), "");
}
function parseFileSize(file:File){
  return `${(file.size/(1024**2)).toFixed(0)} MB`
}
</script>

<template>
  <div class="bg-slate-700 hover:bg-slate-500 w-full px-10 py-2 rounded-lg">
    <div>
      <span class=" text-gray-300">
        {{ parseFilename(files[0]) }}
      </span>
    </div>
    <div>
      Size
      <span class=" text-gray-300 text-sky-600">
        {{ parseFileSize(files[0]) }}
      </span>
    </div>
  </div>
</template>
