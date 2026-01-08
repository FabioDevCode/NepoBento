<script setup lang="ts">
import { computed } from 'vue';
import type { Block } from '@/types';
import { useBentoStore } from '@/stores/bento';
import { Trash2 } from 'lucide-vue-next';

// Composants de blocs
import LinkBlock from './LinkBlock.vue';
import TitleBlock from './TitleBlock.vue';
import TextBlock from './TextBlock.vue';
import ImageBlock from './ImageBlock.vue';

const props = defineProps<{
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select'): void;
  (e: 'delete'): void;
}>();

const store = useBentoStore();

const blockStyle = computed(() => ({
  gridColumn: `span ${props.block.size.width}`,
  gridRow: `span ${props.block.size.height}`,
  backgroundColor: props.block.style?.backgroundColor || '#ffffff',
  borderRadius: props.block.style?.borderRadius || store.theme.borderRadius,
}));

// Composant à afficher en fonction du type de bloc
const blockComponent = computed(() => {
  switch (props.block.type) {
    case 'link':
      return LinkBlock;
    case 'title':
      return TitleBlock;
    case 'text':
      return TextBlock;
    case 'image':
      return ImageBlock;
    default:
      return LinkBlock;
  }
});

function handleClick() {
  if (!props.isPreview) {
    emit('select');
  } else if (props.block.content.url) {
    window.open(props.block.content.url, '_blank');
  }
}
</script>

<template>
  <div 
    class="bento-block group relative bg-white border border-gray-100 shadow-sm transition-all duration-200 overflow-hidden"
    :class="{
      'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-50': isSelected,
      'hover:shadow-md hover:border-gray-200 cursor-grab active:cursor-grabbing': !isSelected && !isPreview,
      'cursor-grab active:cursor-grabbing': isSelected && !isPreview,
      'cursor-pointer hover:scale-[1.02] hover:shadow-lg': isPreview,
    }"
    :style="blockStyle"
    @click="handleClick"
  >
    <!-- Actions (mode éditeur) -->
    <div 
      v-if="!isPreview && isSelected"
      class="absolute top-2 right-2 flex gap-1 z-10"
    >
      <button 
        class="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
        @click.stop="emit('delete')"
        title="Supprimer"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Contenu du bloc (composant dynamique) -->
    <component :is="blockComponent" :block="block" class="h-full w-full" />
  </div>
</template>

<style scoped>
.bento-block {
  min-height: 68px;
  border-radius: 12px;
}
</style>
