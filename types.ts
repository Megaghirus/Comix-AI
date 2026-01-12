export interface Character {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
}

export interface TextPosition {
  x: number;
  y: number;
  scale: number;
}

export interface ComicPanel {
  id: string;
  imageUrl: string;
  caption: string;
  prompt: string;
  textPosition: TextPosition;
}

export interface GeneratedPanelData {
  caption: string;
  imagePrompt: string;
}

export type ComicStyle = 'comic-book' | 'anime' | 'realistic' | 'black-white' | 'watercolor' | 'pixel';

// Global augmentation for the AI Studio window object
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}