<script setup lang="ts">
import type { Block } from '@/types';
import { Image as ImageIcon } from 'lucide-vue-next';

defineProps<{
  block: Block;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full w-full">
    <img 
      v-if="block.content.src"
      :src="block.content.src"
      :alt="block.content.alt || 'Image'"
      class="w-full h-full object-cover"
    />
    <div v-else class="flex flex-col items-center text-gray-400 p-3">
      <ImageIcon class="w-10 h-10 mb-2" />
      <span class="text-xs">Image</span>
    </div>
  </div>
</template>
