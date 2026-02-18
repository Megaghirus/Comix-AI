
export interface Character {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
}

export interface TextBubble {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  type: 'speech' | 'thought' | 'caption';
}

export type PanelSize = 'small' | 'medium' | 'large'; // small = 1/3, medium = 1/2, large = full width

export interface ComicPanel {
  id: string;
  imageUrl: string;
  caption: string;
  prompt: string;
  
  // Layout info
  pageIndex?: number; 
  size: PanelSize; // Preset size
  widthPercent?: number; // NEW: Dynamic custom width percentage (overrides size if present)
  orderIndex: number; // To maintain order in flow layout
  
  bubbles: TextBubble[];
  modelUsed?: string; // Track which AI generated this
}

export interface CoverData {
  title: string;
  subtitle: string;
  imageUrl: string;
  author: string;
}

export interface GeneratedPanelData {
  caption: string;
  imagePrompt: string;
}

export type ComicStyle = 
  | 'comic-book' 
  | 'anime' 
  | 'realistic' 
  | 'black-white' 
  | 'pixel' 
  | 'watercolor' 
  | 'cyberpunk' 
  | 'steampunk' 
  | '3d-render' 
  | 'sketch' 
  | 'retro-80s' 
  | 'flat-art';

export type Language = 'ro' | 'ru' | 'en';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
