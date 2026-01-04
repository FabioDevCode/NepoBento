<script setup lang="ts">
import { computed } from 'vue';
import { useBentoStore } from '@/stores/bento';
import { User, Link, Share2, Type, Image as ImageIcon, Plus } from 'lucide-vue-next';
import type { BlockType } from '@/types';

const store = useBentoStore();

const blockTypes: { type: BlockType; label: string; icon: typeof User }[] = [
  { type: 'profile', label: 'Profil', icon: User },
  { type: 'link', label: 'Lien', icon: Link },
  { type: 'social', label: 'Social', icon: Share2 },
  { type: 'text', label: 'Texte', icon: Type },
  { type: 'image', label: 'Image', icon: ImageIcon },
];

function addBlock(type: BlockType) {
  store.addBlock(type);
}
</script>

<template>
  <div class="bg-gray-900 border-b border-white/10 p-4">
    <div class="flex items-center gap-4">
      <span class="text-sm text-white/60 flex items-center gap-2">
        <Plus class="w-4 h-4" />
        Ajouter un bloc :
      </span>
      <div class="flex gap-2">
        <button 
          v-for="blockType in blockTypes" 
          :key="blockType.type"
          @click="addBlock(blockType.type)"
          class="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
        >
          <component :is="blockType.icon" class="w-4 h-4" />
          <span>{{ blockType.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
