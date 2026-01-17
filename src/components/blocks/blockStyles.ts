import type { BlockType } from '@/types';

export interface BlockContainerStyle {
    // Classes CSS Tailwind pour le conteneur
    classes?: string;
    // Styles inline pour le conteneur
    style?: Record<string, string>;
    // Désactiver le padding par défaut
    noPadding?: boolean;
    // Désactiver le fond blanc par défaut
    noBackground?: boolean;
    // Désactiver la bordure par défaut
    noBorder?: boolean;
}

// Configuration des styles par type de bloc
export const blockContainerStyles: Record<BlockType, BlockContainerStyle> = {
    link: {
        classes: 'bg-white shadow-sm transition-all duration-200',
    },
    title: {
        classes: 'flex items-center bg-transparent transition-all duration-200',
        noBackground: true
    },
    text: {
        classes: 'bg-white shadow-sm transition-all duration-200',
    },
    image: {
        classes: 'bg-white shadow-sm transition-all duration-200'
        // noPadding: true,
        // noBackground: true,
        // noBorder: true,
    },
    map: {
        classes: 'bg-white shadow-sm transition-all duration-200',
        noPadding: true,
    },
};

// Fonction helper pour obtenir les styles d'un type de bloc
export function getBlockContainerStyle(type: BlockType): BlockContainerStyle {
    return blockContainerStyles[type] || {};
}
