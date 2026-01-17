// Types pour l'éditeur Bento

// Les blocs éditables (sans profile qui est géré séparément)
export type BlockType = 'link' | 'text' | 'image' | 'title' | 'map';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// Données du profil (colonne gauche fixe)
export interface Profile {
  name: string;
  bio: string;
  avatar: string;
}

export interface BlockContent {
  // Common
  title?: string;
  description?: string;

  // Link & Social
  url?: string;
  icon?: string;

  // Text
  text?: string;

  // Image
  src?: string;
  alt?: string;

  // Social specific
  platform?: 'twitter' | 'instagram' | 'linkedin' | 'github' | 'youtube' | 'tiktok' | 'facebook' | 'other';
  username?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  position: Position;
  size: Size;
  content: BlockContent;
  style?: BlockStyle;
}

export interface BlockStyle {
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  borderColor?: string;
  borderWidth?: string;
}

export interface Theme {
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
}

export interface Grid {
  columns: number;
  gap: number;
  maxWidth: string;
  rowHeight: number;
}

export interface Metadata {
  title: string;
  description: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface BentoConfig {
  metadata: Metadata;
  theme: Theme;
  grid: Grid;
  profile: Profile;
  blocks: Block[];
}

// Valeurs par défaut
export const defaultProfile: Profile = {
  name: 'Votre Nom',
  bio: 'Une courte description de vous...',
  avatar: '',
};

export const defaultTheme: Theme = {
  backgroundColor: '#F9FAFB',
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  textColor: '#1f2937',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: '12px',
};

export const defaultGrid: Grid = {
  columns: 4,
  gap: 32,
  maxWidth: '900px',
  rowHeight: 68,
};

export const defaultMetadata: Metadata = {
  title: 'Mon Bento',
  description: 'Ma page Bento personnalisée',
  author: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const defaultBentoConfig: BentoConfig = {
  metadata: defaultMetadata,
  theme: defaultTheme,
  grid: defaultGrid,
  profile: defaultProfile,
  blocks: [],
};
