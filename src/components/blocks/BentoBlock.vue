<script setup lang="ts">
import { computed } from 'vue';
import type { Block } from '@/types';
import { useBentoStore } from '@/stores/bento';
import { 
  Link, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Github, 
  Youtube, 
  Facebook,
  Image as ImageIcon,
  Share2,
  Trash2,
  Copy,
  GripVertical
} from 'lucide-vue-next';

const props = defineProps<{
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select'): void;
  (e: 'delete'): void;
  (e: 'duplicate'): void;
}>();

const store = useBentoStore();

const blockStyle = computed(() => ({
  gridColumn: `span ${props.block.size.width}`,
  gridRow: `span ${props.block.size.height}`,
  backgroundColor: props.block.style?.backgroundColor || '#ffffff',
  borderRadius: props.block.style?.borderRadius || store.theme.borderRadius,
}));

const socialIcon = computed(() => {
  const platform = props.block.content.platform;
  switch (platform) {
    case 'twitter': return Twitter;
    case 'instagram': return Instagram;
    case 'linkedin': return Linkedin;
    case 'github': return Github;
    case 'youtube': return Youtube;
    case 'facebook': return Facebook;
    default: return Share2;
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
    class="bento-block group relative bg-white border border-gray-100 shadow-sm transition-all duration-200 cursor-pointer overflow-hidden"
    :class="{
      'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-50': isSelected,
      'hover:shadow-md hover:border-gray-200': !isSelected && !isPreview,
      'hover:scale-[1.02] hover:shadow-lg': isPreview,
    }"
    :style="blockStyle"
    @click="handleClick"
  >
    <!-- Handle de drag (mode éditeur) -->
    <div 
      v-if="!isPreview"
      class="drag-handle absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100"
    >
      <GripVertical class="w-4 h-4 text-gray-400" />
    </div>

    <!-- Actions (mode éditeur) -->
    <div 
      v-if="!isPreview && isSelected"
      class="absolute top-2 right-2 flex gap-1"
    >
      <button 
        class="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
        @click.stop="emit('duplicate')"
        title="Dupliquer"
      >
        <Copy class="w-3.5 h-3.5" />
      </button>
      <button 
        class="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
        @click.stop="emit('delete')"
        title="Supprimer"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Contenu du bloc selon le type -->
    <div class="h-full w-full p-4 flex flex-col items-center justify-center text-center">
      <!-- Link -->
      <template v-if="block.type === 'link'">
        <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
          <Link class="w-5 h-5 text-gray-600" />
        </div>
        <span class="font-medium text-gray-900 text-sm">{{ block.content.title || 'Lien' }}</span>
      </template>

      <!-- Social -->
      <template v-else-if="block.type === 'social'">
        <div class="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-2">
          <component :is="socialIcon" class="w-6 h-6 text-gray-700" />
        </div>
        <span class="text-xs text-gray-500">{{ block.content.username || block.content.platform || 'Social' }}</span>
      </template>

      <!-- Text -->
      <template v-else-if="block.type === 'text'">
        <h4 v-if="block.content.title" class="font-semibold text-gray-900 mb-1 text-sm">{{ block.content.title }}</h4>
        <p class="text-sm text-gray-600 line-clamp-3">{{ block.content.text || 'Texte...' }}</p>
      </template>

      <!-- Image -->
      <template v-else-if="block.type === 'image'">
        <img 
          v-if="block.content.src"
          :src="block.content.src"
          :alt="block.content.alt || 'Image'"
          class="w-full h-full object-cover"
        />
        <div v-else class="flex flex-col items-center text-gray-400">
          <ImageIcon class="w-10 h-10 mb-2" />
          <span class="text-xs">Image</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.bento-block {
  min-height: 100px;
  border-radius: 12px;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
