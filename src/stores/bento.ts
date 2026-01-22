import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { BentoConfig, Block, Theme, Grid, Metadata, BlockType, Position, Size, Profile } from '@/types';
import { defaultBentoConfig, defaultTheme, defaultGrid, defaultProfile } from '@/types';

const STORAGE_KEY = 'nepobento-config';

// Génère un ID unique
const generateId = (): string => {
  return `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const useBentoStore = defineStore('bento', () => {
  // État
  const config = ref<BentoConfig>(loadFromStorage());
  const selectedBlockId = ref<string | null>(null);
  const isDragging = ref(false);

  // Getters
  const blocks = computed(() => config.value.blocks);
  const theme = computed(() => config.value.theme);
  const grid = computed(() => config.value.grid);
  const metadata = computed(() => config.value.metadata);
  const profile = computed(() => config.value.profile);

  const selectedBlock = computed(() => {
    if (!selectedBlockId.value) return null;
    return config.value.blocks.find(b => b.id === selectedBlockId.value) || null;
  });

  // Charger depuis localStorage
  function loadFromStorage(): BentoConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration: ajouter profile si absent
        if (!parsed.profile) {
          parsed.profile = { ...defaultProfile };
        }
        return parsed;
      }
    } catch (error) {
      console.error('Erreur lors du chargement depuis localStorage:', error);
    }
    return { ...defaultBentoConfig, profile: { ...defaultProfile } };
  }

  // Sauvegarder dans localStorage
  function saveToStorage(): void {
    try {
      config.value.metadata.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans localStorage:', error);
    }
  }

  // Auto-save lors des changements
  watch(config, () => {
    saveToStorage();
  }, { deep: true });

  // Trouver la première position disponible pour un bloc de taille donnée
  function findFirstAvailablePosition(blockSize: Size): Position {
    const columns = config.value.grid.columns;
    const blocks = config.value.blocks;

    // Créer une map des cellules occupées
    const occupiedCells = new Set<string>();
    blocks.forEach(block => {
      for (let row = block.position.y; row < block.position.y + block.size.height; row++) {
        for (let col = block.position.x; col < block.position.x + block.size.width; col++) {
          occupiedCells.add(`${row}-${col}`);
        }
      }
    });

    // Chercher la première position où le bloc peut rentrer
    for (let row = 0; row < 100; row++) { // Limite raisonnable
      for (let col = 0; col <= columns - blockSize.width; col++) {
        // Vérifier si toutes les cellules nécessaires sont libres
        let canFit = true;
        for (let r = row; r < row + blockSize.height && canFit; r++) {
          for (let c = col; c < col + blockSize.width && canFit; c++) {
            if (occupiedCells.has(`${r}-${c}`)) {
              canFit = false;
            }
          }
        }
        if (canFit) {
          return { x: col, y: row };
        }
      }
    }

    // Fallback: mettre en dessous de tout
    const maxY = blocks.length > 0
      ? Math.max(...blocks.map(b => b.position.y + b.size.height))
      : 0;
    return { x: 0, y: maxY };
  }

  // Actions - Blocs
  function addBlock(type: BlockType, position?: Position, size?: Size): Block {
    const blockSize = size || getDefaultSizeForType(type);
    const blockPosition = position || findFirstAvailablePosition(blockSize);
    const newBlock: Block = {
      id: generateId(),
      type,
      position: blockPosition,
      size: blockSize,
      content: getDefaultContentForType(type),
    };
    // Réassigner le tableau pour forcer la réactivité
    config.value.blocks = [...config.value.blocks, newBlock];
    selectedBlockId.value = newBlock.id;
    return newBlock;
  }

  // Ajouter un bloc avec du contenu personnalisé (pour éviter les problèmes de réactivité)
  function addBlockWithContent(type: BlockType, content: Block['content'], position?: Position, size?: Size): Block {
    const blockSize = size || getDefaultSizeForType(type);
    const blockPosition = position || findFirstAvailablePosition(blockSize);
    const newBlock: Block = {
      id: generateId(),
      type,
      position: blockPosition,
      size: blockSize,
      content: { ...getDefaultContentForType(type), ...content },
    };
    // Réassigner le tableau pour forcer la réactivité
    config.value.blocks = [...config.value.blocks, newBlock];
    selectedBlockId.value = newBlock.id;
    return newBlock;
  }

  function updateBlock(id: string, updates: Partial<Omit<Block, 'id'>>): void {
    const index = config.value.blocks.findIndex(b => b.id === id);
    if (index !== -1) {
      const block = config.value.blocks[index];
      if (block) {
        // Mise à jour réactive en remplaçant le bloc entier
        config.value.blocks[index] = {
          ...block,
          ...updates,
          content: updates.content ? { ...block.content, ...updates.content } : block.content,
        };
      }
    }
  }

  function deleteBlock(id: string): void {
    const index = config.value.blocks.findIndex(b => b.id === id);
    if (index !== -1) {
      config.value.blocks.splice(index, 1);
      if (selectedBlockId.value === id) {
        selectedBlockId.value = null;
      }
      // Compacter les blocs vers le haut après suppression
      compactBlocksUp();
    }
  }

  // Compacter les blocs vers le haut pour combler les espaces vides
  function compactBlocksUp(): void {
    const columns = config.value.grid.columns;
    const blocks = config.value.blocks;

    if (blocks.length === 0) return;

    let hasChanges = true;
    let iterations = 0;
    const maxIterations = 100;

    while (hasChanges && iterations < maxIterations) {
      hasChanges = false;
      iterations++;

      // Trier les blocs par position Y (du plus haut au plus bas)
      const sortedBlocks = [...blocks].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

      for (const block of sortedBlocks) {
        if (block.position.y === 0) continue;

        // Essayer de remonter le bloc le plus haut possible
        let bestY = block.position.y;

        // Tester chaque position de Y=0 jusqu'à la position actuelle
        for (let testY = 0; testY < block.position.y; testY++) {
          // Vérifier s'il y a collision avec d'autres blocs
          let canMove = true;

          for (const otherBlock of blocks) {
            if (otherBlock.id === block.id) continue;

            // Vérifier le chevauchement
            const testLeft = block.position.x;
            const testRight = block.position.x + block.size.width;
            const testTop = testY;
            const testBottom = testY + block.size.height;

            const otherLeft = otherBlock.position.x;
            const otherRight = otherBlock.position.x + otherBlock.size.width;
            const otherTop = otherBlock.position.y;
            const otherBottom = otherBlock.position.y + otherBlock.size.height;

            const overlapsX = testLeft < otherRight && testRight > otherLeft;
            const overlapsY = testTop < otherBottom && testBottom > otherTop;

            if (overlapsX && overlapsY) {
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
        if (bestY < block.position.y) {
          block.position.y = bestY;
          hasChanges = true;
        }
      }
    }
  }

  function duplicateBlock(id: string): Block | null {
    const block = config.value.blocks.find(b => b.id === id);
    if (!block) return null;

    const newBlock: Block = {
      ...JSON.parse(JSON.stringify(block)),
      id: generateId(),
      position: {
        x: block.position.x,
        y: block.position.y + block.size.height,
      },
    };
    config.value.blocks.push(newBlock);
    selectedBlockId.value = newBlock.id;
    return newBlock;
  }

  function reorderBlocks(newOrder: Block[]): void {
    config.value.blocks = newOrder;
  }

  function updateBlockPosition(id: string, position: Position): void {
    const index = config.value.blocks.findIndex(b => b.id === id);
    if (index !== -1) {
      const block = config.value.blocks[index];
      if (block) {
        // Créer un nouveau bloc avec la nouvelle position
        const updatedBlock: Block = {
          id: block.id,
          type: block.type,
          position: { ...position },
          size: block.size,
          content: block.content,
          style: block.style,
        };
        // Réassigner le tableau entier pour déclencher la réactivité
        config.value.blocks = [
          ...config.value.blocks.slice(0, index),
          updatedBlock,
          ...config.value.blocks.slice(index + 1),
        ];
      }
    }
  }

  // Actions - Thème
  function updateTheme(updates: Partial<Theme>): void {
    config.value.theme = { ...config.value.theme, ...updates };
  }

  function resetTheme(): void {
    config.value.theme = { ...defaultTheme };
  }

  // Actions - Grille
  function updateGrid(updates: Partial<Grid>): void {
    config.value.grid = { ...config.value.grid, ...updates };
  }

  function resetGrid(): void {
    config.value.grid = { ...defaultGrid };
  }

  // Actions - Metadata
  function updateMetadata(updates: Partial<Metadata>): void {
    config.value.metadata = { ...config.value.metadata, ...updates };
  }

  // Actions - Profile
  function updateProfile(updates: Partial<Profile>): void {
    config.value.profile = { ...config.value.profile, ...updates };
  }

  function resetProfile(): void {
    config.value.profile = { ...defaultProfile };
  }

  // Actions - Import/Export
  function exportConfig(): string {
    return JSON.stringify(config.value, null, 2);
  }

  function importConfig(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString) as BentoConfig;
      // Validation basique
      if (!imported.metadata || !imported.theme || !imported.grid || !imported.blocks) {
        throw new Error('Configuration invalide');
      }
      // Migration: ajouter profile si absent
      if (!imported.profile) {
        imported.profile = { ...defaultProfile };
      }
      config.value = imported;
      selectedBlockId.value = null;
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      return false;
    }
  }

  function resetConfig(): void {
    config.value = {
      ...defaultBentoConfig,
      profile: { ...defaultProfile },
      metadata: {
        ...defaultBentoConfig.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    selectedBlockId.value = null;
  }

  // Sélection
  function selectBlock(id: string | null): void {
    selectedBlockId.value = id;
  }

  function clearSelection(): void {
    selectedBlockId.value = null;
  }

  // Helpers
  function getDefaultSizeForType(type: BlockType): Size {
    switch (type) {
      case 'image':
        return { width: 2, height: 4 };
      case 'map':
        return { width: 2, height: 4 };
      case 'text':
        return { width: 2, height: 4 };
      case 'title':
        return { width: 4, height: 1 };
      case 'link':
        return { width: 2, height: 1 };
      default:
        return { width: 2, height: 1 };
    }
  }

  function getDefaultContentForType(type: BlockType): Block['content'] {
    switch (type) {
      case 'link':
        return {
          title: 'Mon Lien',
          url: 'https://example.com',
        };
      case 'text':
        return {
          text: 'Votre texte ici...',
        };
      case 'title':
        return {
          title: 'Titre',
        };
      case 'image':
        return {
          src: '',
          alt: 'Image',
        };
      case 'map':
        return {
          lat: 50,
          lng: 10,
          zoom: 4,
        };
      default:
        return {};
    }
  }

  return {
    // État
    config,
    selectedBlockId,
    isDragging,
    // Getters
    blocks,
    theme,
    grid,
    metadata,
    profile,
    selectedBlock,
    // Actions - Blocs
    addBlock,
    addBlockWithContent,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    reorderBlocks,
    updateBlockPosition,
    // Actions - Profile
    updateProfile,
    resetProfile,
    // Actions - Thème
    updateTheme,
    resetTheme,
    // Actions - Grille
    updateGrid,
    resetGrid,
    // Actions - Metadata
    updateMetadata,
    // Actions - Import/Export
    exportConfig,
    importConfig,
    resetConfig,
    // Sélection
    selectBlock,
    clearSelection,
  };
});
