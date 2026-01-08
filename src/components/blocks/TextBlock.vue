<script setup lang="ts">
import type { Block } from '@/types';

defineProps<{
  block: Block;
}>();
</script>

<template>
  <div class="flex flex-col justify-start h-full w-full p-3 overflow-auto">
    <p class="text-sm text-gray-600 text-left">
      {{ block.content.text || 'Votre texte ici...' }}
    </p>
  </div>
</template>
