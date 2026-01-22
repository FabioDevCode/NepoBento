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
import MapBlock from './MapBlock.vue';

// Configuration des styles de conteneur
import { getBlockContainerStyle } from './blockStyles';

const props = defineProps<{
  block: Block;
}>();

const emit = defineEmits<{
  (e: 'delete'): void;
}>();

const store = useBentoStore();

// Récupérer la configuration de style pour ce type de bloc
const containerConfig = computed(() => getBlockContainerStyle(props.block.type));

const blockStyle = computed(() => ({
  gridColumn: `span ${props.block.size.width}`,
  gridRow: `span ${props.block.size.height}`,
  backgroundColor: containerConfig.value.noBackground
    ? 'transparent'
    : (props.block.style?.backgroundColor || '#ffffff'),
  borderRadius: props.block.style?.borderRadius || store.theme.borderRadius,
  ...containerConfig.value.style,
}));

// Classes dynamiques basées sur la configuration du bloc
const containerClasses = computed(() => {
  const config = containerConfig.value;
  return [
    config.classes || '',
    {
      'border border-gray-100': !config.noBorder,
      'border-0': config.noBorder,
    }
  ];
});

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
    case 'map':
      return MapBlock;
    default:
      return LinkBlock;
  }
});
</script>

<template>
  <div
    class="group relative min-h-17 rounded-xl hover:bg-white hover:ring-1 hover:ring-gray-900 hover:ring-offset-2 hover:ring-offset-gray-50 hover:shadow-md transition-all duration-150"
    :class="[containerClasses]"
    :style="blockStyle"
  >
    <!-- Handle de drag (zone pour saisir le bloc) -->
    <div
      class="drag-handle absolute inset-0 z-5 cursor-grab active:cursor-grabbing"
    />

    <!-- Actions (visible au hover) -->
    <div
      class="absolute -top-3 -right-3 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
    >
      <button
        class="p-1.5 cursor-pointer rounded-lg bg-red-100 text-red-500 ring-1 ring-red-500 transition-colors"
        @click.stop="emit('delete')"
        title="Supprimer"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Contenu du bloc (composant dynamique) -->
    <component :is="blockComponent" :block="block" class="h-full w-full relative z-1" />
  </div>
</template>
