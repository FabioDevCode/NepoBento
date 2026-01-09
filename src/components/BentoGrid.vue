<script setup lang="ts">
import { computed } from 'vue';
import draggable from 'vuedraggable';
import { useBentoStore } from '@/stores/bento';
import BentoBlock from '@/components/blocks/BentoBlock.vue';

const props = defineProps<{
  isPreview?: boolean;
}>();

const store = useBentoStore();

const blocks = computed({
  get: () => store.blocks,
  set: (value) => store.reorderBlocks(value),
});

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${store.grid.columns}, 1fr)`,
  gap: `${store.grid.gap}px`,
  maxWidth: store.grid.maxWidth,
  gridAutoRows: `${store.grid.rowHeight}px`,
}));

const containerStyle = computed(() => ({
  backgroundColor: store.theme.backgroundColor,
  fontFamily: store.theme.fontFamily,
  color: store.theme.textColor,
}));

function handleSelect(id: string) {
  if (!props.isPreview) {
    store.selectBlock(id);
  }
}

function handleDelete(id: string) {
  store.deleteBlock(id);
}

function handleDuplicate(id: string) {
  store.duplicateBlock(id);
}
</script>

<template>
  <div 
    class="min-h-screen py-8 px-4"
    :style="containerStyle"
    @click.self="store.clearSelection"
  >
    <div class="mx-auto" :style="{ maxWidth: store.grid.maxWidth }">
      <!-- Mode Prévisualisation -->
      <div v-if="isPreview" :style="gridStyle">
        <BentoBlock 
          v-for="block in blocks" 
          :key="block.id"
          :block="block"
          :is-preview="true"
        />
      </div>

      <!-- Mode Éditeur avec drag & drop -->
      <draggable 
        v-else
        v-model="blocks"
        item-key="id"
        :style="gridStyle"
        ghost-class="ghost"
        chosen-class="chosen"
        drag-class="drag"
        handle=".cursor-grab"
        animation="200"
      >
        <template #item="{ element }">
          <BentoBlock 
            :block="element"
            @delete="handleDelete(element.id)"
            @duplicate="handleDuplicate(element.id)"
          />
        </template>
      </draggable>

      <!-- État vide -->
      <div 
        v-if="blocks.length === 0"
        class="flex flex-col items-center justify-center py-20 text-center"
      >
        <div class="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white/80 mb-2">Aucun bloc</h3>
        <p class="text-white/40 max-w-md">
          Commencez par ajouter des blocs à votre page Bento en utilisant la barre d'outils ci-dessus.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ghost {
  opacity: 0.5;
  background: rgba(59, 130, 246, 0.2);
  border: 2px dashed rgba(59, 130, 246, 0.5);
}

.chosen {
  opacity: 0.9;
}

.drag {
  opacity: 0.9;
  transform: rotate(2deg);
}
</style>
