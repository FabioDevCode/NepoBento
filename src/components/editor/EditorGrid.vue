<script setup lang="ts">
import { computed, ref, watch, nextTick, shallowRef } from 'vue';
import draggable from 'vuedraggable';
import { useBentoStore } from '@/stores/bento';
import BentoBlock from '@/components/blocks/BentoBlock.vue';
import { Plus } from 'lucide-vue-next';
import type { Block } from '@/types';

const store = useBentoStore();

// Clé pour forcer le re-render du draggable
const draggableKey = ref(0);

// Type pour les cellules de la grille (bloc réel ou placeholder)
interface GridCell {
    id: string;
    type: 'block' | 'placeholder';
    block?: Block;
    row: number;
    col: number;
}

// Copie locale des blocs pour le drag & drop
const localBlocks = shallowRef<Block[]>([]);

// Fonction pour mettre à jour localBlocks depuis le store
function syncFromStore() {
    // Accéder directement aux blocs du store
    const storeBlocksArray = store.blocks;
    // Créer une copie profonde
    localBlocks.value = storeBlocksArray.map(b => ({
        ...b,
        position: { ...b.position },
        size: { ...b.size },
        content: b.content ? { ...b.content } : {},
    }));
    // Forcer le re-render
    draggableKey.value++;
}

// Synchroniser au démarrage
syncFromStore();

// Watch profond sur les blocs du store
watch(
    () => store.blocks,
    () => {
        nextTick(syncFromStore);
    },
    { deep: true }
);

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

// ============================================
// SYSTÈME DE PLACEMENT INTELLIGENT DES BLOCS
// ============================================

interface BlockPosition {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

// Vérifier si deux rectangles se chevauchent
function rectanglesOverlap(a: BlockPosition, b: BlockPosition): boolean {
    const aLeft = a.x;
    const aRight = a.x + a.width;
    const aTop = a.y;
    const aBottom = a.y + a.height;

    const bLeft = b.x;
    const bRight = b.x + b.width;
    const bTop = b.y;
    const bBottom = b.y + b.height;

    const overlapsX = aLeft < bRight && aRight > bLeft;
    const overlapsY = aTop < bBottom && aBottom > bTop;

    return overlapsX && overlapsY;
}

// Calculer la nouvelle position pour un bloc décalé (le pousser vers le bas)
function pushBlockDown(
    blockToMove: BlockPosition,
    pusher: BlockPosition
): BlockPosition {
    // Décaler le bloc juste en dessous du "pusher"
    return {
        ...blockToMove,
        y: pusher.y + pusher.height,
    };
}

// Réorganiser tous les blocs après avoir placé un bloc à une nouvelle position
function reorganizeBlocks(
    movedBlockId: string,
    newX: number,
    newY: number,
    allBlocks: Block[]
): Map<string, { x: number; y: number }> {
    // Créer une copie de travail des positions
    const workingPositions = new Map<string, BlockPosition>();

    allBlocks.forEach(block => {
        if (block.id === movedBlockId) {
            // Le bloc qu'on déplace va à sa nouvelle position
            workingPositions.set(block.id, {
                id: block.id,
                x: newX,
                y: newY,
                width: block.size.width,
                height: block.size.height,
            });
        } else {
            workingPositions.set(block.id, {
                id: block.id,
                x: block.position.x,
                y: block.position.y,
                width: block.size.width,
                height: block.size.height,
            });
        }
    });

    // Résoudre les collisions de manière itérative
    let hasCollisions = true;
    let iterations = 0;
    const maxIterations = 100; // Sécurité anti-boucle infinie

    while (hasCollisions && iterations < maxIterations) {
        hasCollisions = false;
        iterations++;

        // Le bloc qu'on a déplacé est prioritaire
        const movedBlock = workingPositions.get(movedBlockId);
        if (!movedBlock) break;

        // Vérifier les collisions avec le bloc déplacé
        const allPositions = Array.from(workingPositions.values());

        for (const otherBlock of allPositions) {
            if (otherBlock.id === movedBlockId) continue;

            if (rectanglesOverlap(movedBlock, otherBlock)) {
                hasCollisions = true;

                // Pousser l'autre bloc vers le bas
                const newPos = pushBlockDown(otherBlock, movedBlock);
                workingPositions.set(otherBlock.id, newPos);
            }
        }

        // Maintenant vérifier les collisions entre les autres blocs (cascade)
        const sortedBlocks = Array.from(workingPositions.values())
            .sort((a, b) => a.y - b.y || a.x - b.x);

        for (let i = 0; i < sortedBlocks.length; i++) {
            const blockA = sortedBlocks[i];
            if (!blockA || blockA.id === movedBlockId) continue;

            for (let j = i + 1; j < sortedBlocks.length; j++) {
                const blockB = sortedBlocks[j];
                if (!blockB || blockB.id === movedBlockId) continue;

                const currentA = workingPositions.get(blockA.id);
                const currentB = workingPositions.get(blockB.id);

                if (currentA && currentB && rectanglesOverlap(currentA, currentB)) {
                    hasCollisions = true;
                    // Le bloc B (plus bas dans le tri) est poussé vers le bas
                    const newPos = pushBlockDown(currentB, currentA);
                    workingPositions.set(blockB.id, newPos);
                }
            }
        }
    }

    // ============================================
    // COMPACTAGE : Remonter les blocs vers le haut
    // ============================================
    compactBlocksUp(workingPositions);

    // Retourner les nouvelles positions
    const result = new Map<string, { x: number; y: number }>();
    workingPositions.forEach((pos, id) => {
        result.set(id, { x: pos.x, y: pos.y });
    });

    return result;
}

// Compacter les blocs vers le haut pour combler les espaces vides
function compactBlocksUp(
    workingPositions: Map<string, BlockPosition>
): void {
    let hasChanges = true;
    let iterations = 0;
    const maxIterations = 100;

    while (hasChanges && iterations < maxIterations) {
        hasChanges = false;
        iterations++;

        // Trier les blocs par position Y (du plus haut au plus bas)
        // Tous les blocs peuvent remonter, y compris celui qu'on vient de déplacer
        const sortedBlocks = Array.from(workingPositions.values())
            .sort((a, b) => a.y - b.y || a.x - b.x);

        for (const block of sortedBlocks) {
            const currentPos = workingPositions.get(block.id);
            if (!currentPos || currentPos.y === 0) continue;

            // Essayer de remonter le bloc le plus haut possible
            let bestY = currentPos.y;

            // Tester chaque position de Y=0 jusqu'à la position actuelle
            for (let testY = 0; testY < currentPos.y; testY++) {
                const testPosition: BlockPosition = {
                    ...currentPos,
                    y: testY,
                };

                // Vérifier s'il y a collision avec d'autres blocs
                let canMove = true;
                for (const otherBlock of workingPositions.values()) {
                    if (otherBlock.id === block.id) continue;

                    if (rectanglesOverlap(testPosition, otherBlock)) {
                        canMove = false;
                        break;
                    }
                }

                if (canMove) {
                    bestY = testY;
                    break; // On prend la position la plus haute possible
                }
            }

            // Si on peut remonter, mettre à jour la position
            if (bestY < currentPos.y) {
                workingPositions.set(block.id, {
                    ...currentPos,
                    y: bestY,
                });
                hasChanges = true;
            }
        }
    }
}

// Vérifier si la position est valide (dans les limites de la grille)
function isValidPosition(x: number, y: number, width: number, columns: number): boolean {
    return x >= 0 && y >= 0 && x + width <= columns;
}

// Gérer le drop d'un bloc
function onDragEnd(evt: any) {
    const { oldIndex, newIndex } = evt;
    if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
        localCells.value = [...gridCells.value];
        return;
    }

    const originalCells = gridCells.value;
    const draggedCell = originalCells[oldIndex];
    const targetCell = originalCells[newIndex];

    if (!draggedCell || draggedCell.type !== 'block' || !draggedCell.block) {
        localCells.value = [...gridCells.value];
        return;
    }
    if (!targetCell) {
        localCells.value = [...gridCells.value];
        return;
    }

    const block = draggedCell.block;
    const columns = store.grid.columns;

    // Déterminer la position cible
    let targetX: number;
    let targetY: number;

    if (targetCell.type === 'placeholder') {
        targetX = targetCell.col;
        targetY = targetCell.row;
    } else if (targetCell.type === 'block' && targetCell.block) {
        // On prend la position du bloc cible
        targetX = targetCell.block.position.x;
        targetY = targetCell.block.position.y;
    } else {
        localCells.value = [...gridCells.value];
        return;
    }

    // Vérifier que la position est valide (dans les limites)
    if (!isValidPosition(targetX, targetY, block.size.width, columns)) {
        // Essayer d'ajuster la position X si le bloc dépasse à droite
        if (targetX + block.size.width > columns) {
            targetX = columns - block.size.width;
        }
        if (targetX < 0) {
            localCells.value = [...gridCells.value];
            return;
        }
    }

    // Réorganiser tous les blocs
    const newPositions = reorganizeBlocks(
        block.id,
        targetX,
        targetY,
        [...localBlocks.value]
    );

    // Appliquer les nouvelles positions
    newPositions.forEach((pos, blockId) => {
        const originalBlock = localBlocks.value.find(b => b.id === blockId);
        if (originalBlock) {
            const originalPos = originalBlock.position;
            if (originalPos.x !== pos.x || originalPos.y !== pos.y) {
                store.updateBlockPosition(blockId, pos);
            }
        }
    });

    // Forcer la synchronisation immédiate
    setTimeout(() => {
        syncFromStore();
    }, 50);
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
    // Forcer la synchronisation après suppression
    setTimeout(() => {
        syncFromStore();
    }, 50);
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
            :key="draggableKey"
            v-model="localCells"
            item-key="id"
            :style="gridStyle"
            ghost-class="ghost"
            chosen-class="chosen"
            drag-class="drag"
            handle=".drag-handle"
            :filter="'.placeholder-cell'"
            :preventOnFilter="false"
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
                    class="h-full"
                    @delete="handleDelete(element.block.id)"
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
    padding: 60px 60px 60px 120px;
}
</style>
