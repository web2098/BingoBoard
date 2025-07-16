// Board components for the Bingo application
export { default as BoardPreviewModal } from './BoardPreviewModal';
export { default as GameBoard } from './GameBoard';
export { default as OperatorIcon } from './OperatorIcon';
export { default as FreeSpaceToggle } from './FreeSpaceToggle';

// Export types for reuse
export interface GameData {
  id: number;
  name: string;
  variant: number;
  freeSpace: boolean;
  totalNumbers?: number;
}
