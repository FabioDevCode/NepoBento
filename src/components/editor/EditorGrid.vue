<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import draggable from 'vuedraggable';
import { useBentoStore } from '@/stores/bento';
import BentoBlock from '@/components/blocks/BentoBlock.vue';
import { Plus } from 'lucide-vue-next';
import type { Block, Size } from '@/types';

const store = useBentoStore();

// Type pour les cellules de la grille (bloc réel ou placeholder)
interface GridCell {
    id: string;
    type: 'block' | 'placeholder';
    block?: Block;
    row: number;
    col: number;
}

// Copie locale des blocs pour le drag & drop
const localBlocks = ref<Block[]>([...store.blocks]);

// Synchroniser quand le store change (ajout, suppression, etc.)
watch(() => store.blocks, (newBlocks) => {
    localBlocks.value = [...newBlocks];
}, { deep: true, immediate: true });

// Surveiller aussi la longueur du tableau pour les suppressions complètes
watch(() => store.blocks.length, () => {
    localBlocks.value = [...store.blocks];
});

// Calculer le nombre de rows occupées par les blocs
const occupiedRows = computed(() => {
    if (localBlocks.value.length === 0) return 0;
    return Math.max(...localBlocks.value.map(b => b.position.y + b.size.height));
});

// Nombre minimum de rows à afficher
const minRows = computed(() => {
    if (localBlocks.value.length === 0) return 4;
    return occupiedRows.value + 4;
});

// Générer toutes les cellules de la grille (blocs + placeholders)
const gridCells = computed<GridCell[]>(() => {
    const cells: GridCell[] = [];
    const columns = store.grid.columns;
    const rows = minRows.value;

    // Créer une map des positions occupées par des blocs
    const occupiedPositions = new Set<string>();
    localBlocks.value.forEach(block => {
        // Marquer toutes les cellules occupées par ce bloc
        for (let r = block.position.y; r < block.position.y + block.size.height; r++) {
            for (let c = block.position.x; c < block.position.x + block.size.width; c++) {
                occupiedPositions.add(`${r}-${c}`);
            }
        }
    });

    // Ajouter d'abord les blocs réels
    localBlocks.value.forEach(block => {
        cells.push({
            id: block.id,
            type: 'block',
            block: block,
            row: block.position.y,
            col: block.position.x,
        });
    });

    // Ajouter les placeholders pour les cellules vides
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            if (!occupiedPositions.has(`${row}-${col}`)) {
                cells.push({
                    id: `placeholder-${row}-${col}`,
                    type: 'placeholder',
                    row: row,
                    col: col,
                });
            }
        }
    }

    // Trier les cellules par position (ligne puis colonne)
    cells.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
    });

    return cells;
});

// Liste locale des cellules pour vuedraggable
const localCells = ref<GridCell[]>([]);

watch(gridCells, (newCells) => {
    localCells.value = [...newCells];
}, { immediate: true });

// Vérifier si un bloc peut tenir à une position donnée
function canBlockFitAt(blockId: string, blockSize: Size, targetRow: number, targetCol: number): boolean {
    const columns = store.grid.columns;

    // Vérifier les limites de la grille
    if (targetCol + blockSize.width > columns) return false;
    if (targetCol < 0 || targetRow < 0) return false;

    // Vérifier les collisions avec d'autres blocs
    for (const block of localBlocks.value) {
        if (block.id === blockId) continue; // Ignorer le bloc qu'on déplace

        // Vérifier si les rectangles se chevauchent
        const blockLeft = block.position.x;
        const blockRight = block.position.x + block.size.width;
        const blockTop = block.position.y;
        const blockBottom = block.position.y + block.size.height;

        const targetLeft = targetCol;
        const targetRight = targetCol + blockSize.width;
        const targetTop = targetRow;
        const targetBottom = targetRow + blockSize.height;

        const overlapsX = targetLeft < blockRight && targetRight > blockLeft;
        const overlapsY = targetTop < blockBottom && targetBottom > blockTop;

        if (overlapsX && overlapsY) return false;
    }

    return true;
}

// Gérer le drop d'un bloc
function onDragEnd(evt: any) {
    const { oldIndex, newIndex } = evt;
    if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;

    const draggedCell = gridCells.value[oldIndex];
    const targetCell = gridCells.value[newIndex];

    if (!draggedCell || draggedCell.type !== 'block' || !draggedCell.block) return;
    if (!targetCell) return;

    const block = draggedCell.block;

    // Si on drop sur un placeholder, vérifier si le bloc peut tenir
    if (targetCell.type === 'placeholder') {
        if (canBlockFitAt(block.id, block.size, targetCell.row, targetCell.col)) {
            store.updateBlockPosition(block.id, {
                x: targetCell.col,
                y: targetCell.row,
            });
        }
    }
    // Si on drop sur un autre bloc, échanger les positions si possible
    else if (targetCell.type === 'block' && targetCell.block) {
        const targetBlock = targetCell.block;
        const draggedPos = { x: block.position.x, y: block.position.y };
        const targetPos = { x: targetBlock.position.x, y: targetBlock.position.y };

        // Vérifier si l'échange est possible
        const canDraggedFit = canBlockFitAt(block.id, block.size, targetPos.y, targetPos.x);
        const canTargetFit = canBlockFitAt(targetBlock.id, targetBlock.size, draggedPos.y, draggedPos.x);

        if (canDraggedFit && canTargetFit) {
            store.updateBlockPosition(block.id, targetPos);
            store.updateBlockPosition(targetBlock.id, draggedPos);
        }
    }
}

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

// Style pour positionner chaque cellule dans la grille
function getCellStyle(cell: GridCell) {
    if (cell.type === 'block' && cell.block) {
        return {
            gridColumn: `${cell.col + 1} / span ${cell.block.size.width}`,
            gridRow: `${cell.row + 1} / span ${cell.block.size.height}`,
        };
    }
    return {
        gridColumn: `${cell.col + 1}`,
        gridRow: `${cell.row + 1}`,
    };
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
            v-model="localCells"
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
            <div 
                :class="element.type === 'block' ? 'block-cell h-full' : 'placeholder-cell'"
                :style="getCellStyle(element)"
            >
                <BentoBlock
                    v-if="element.type === 'block' && element.block"
                    :block="element.block"
                    :is-selected="store.selectedBlockId === element.block.id"
                    class="h-full"
                    @select="handleSelect(element.block.id)"
                    @delete="handleDelete(element.block.id)"
                    @duplicate="handleDuplicate(element.block.id)"
                />
            </div>
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

.placeholder-cell {
    min-height: 68px;
    border-radius: 12px;
    border: 2px dashed transparent;
    transition: all 0.2s ease;
}

.placeholder-cell:hover {
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(59, 130, 246, 0.05);
}

#grid {
    padding: 60px;
}
</style>
