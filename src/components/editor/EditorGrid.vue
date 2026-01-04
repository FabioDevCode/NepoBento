<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import draggable from 'vuedraggable';
import { useBentoStore } from '@/stores/bento';
import BentoBlock from '@/components/blocks/BentoBlock.vue';
import { Plus } from 'lucide-vue-next';
import type { Block } from '@/types';

const store = useBentoStore();

// Copie locale des blocs pour le drag & drop
const localBlocks = ref<Block[]>([...store.blocks]);

// Synchroniser quand le store change (ajout, suppression, etc.)
watch(() => store.blocks, (newBlocks) => {
    localBlocks.value = [...newBlocks];
}, { deep: true });

// Mettre à jour le store quand le drag & drop est terminé
function onDragEnd() {
    store.reorderBlocks([...localBlocks.value]);
}

// Calculer le nombre de rows occupées par les blocs
const occupiedRows = computed(() => {
    if (localBlocks.value.length === 0) return 0;
    return Math.max(...localBlocks.value.map(b => b.position.y + b.size.height));
});

// Nombre minimum de rows à afficher
const minRows = computed(() => {
    if (localBlocks.value.length === 0) return 4;
    return occupiedRows.value + 8;
});

const gridStyle = computed(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${store.grid.columns}, 1fr)`,
    gap: `32px`,
    gridAutoRows: `68px`,
    gridTemplateRows: `repeat(${minRows.value}, 68px)`,
}));

function handleSelect(id: string) {
    store.selectBlock(id);
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
        id="grid"
        class="flex-1"
        @click.self="store.clearSelection"
    >
        <!-- Mode Éditeur avec drag & drop -->
        <draggable
            v-if="localBlocks.length > 0"
            v-model="localBlocks"
            item-key="id"
            :style="gridStyle"
            ghost-class="ghost"
            chosen-class="chosen"
            drag-class="drag"
            handle=".drag-handle"
            animation="200"
            @end="onDragEnd"
        >
        <template #item="{ element }">
            <BentoBlock
            :block="element"
            :is-selected="store.selectedBlockId === element.id"
            @select="handleSelect(element.id)"
            @delete="handleDelete(element.id)"
            @duplicate="handleDuplicate(element.id)"
            />
        </template>
        </draggable>

        <!-- État vide -->
        <div
            v-else
            class="h-full flex flex-col items-center justify-center text-center"
        >
            <div class="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Plus class="w-10 h-10 text-gray-300" />
            </div>
            <h3 class="text-lg font-medium text-gray-700 mb-2">
                Aucun bloc
            </h3>
            <p class="text-gray-500 text-sm max-w-xs">
                Utilisez la barre d'outils en bas pour ajouter des blocs à votre page.
            </p>
        </div>
    </div>
</template>

<style scoped>
.ghost {
    opacity: 0.5;
    background: rgba(59, 130, 246, 0.1);
    border: 2px dashed rgba(59, 130, 246, 0.4);
    border-radius: 12px;
}

.chosen {
    opacity: 0.95;
}

.drag {
    opacity: 0.95;
    transform: rotate(1deg);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

#grid {
    padding: 60px;
}
</style>
