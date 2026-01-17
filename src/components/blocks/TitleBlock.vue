<script setup lang="ts">
import type { Block } from '@/types';

defineProps<{
  block: Block;
}>();
</script>

<template>
  <div class="flex items-center justify-start h-full w-full p-3 bg-transparent">
    <h2 class="w-full text-left font-bold text-gray-900 text-xl">
      {{ block.content.title || 'TITRE' }}
    </h2>
  </div>
</template>
