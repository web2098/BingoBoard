import React from 'react';
import GameBoard from './GameBoard';
import OperatorIcon from './OperatorIcon';
import FreeSpaceToggle from './FreeSpaceToggle';
import games from '../../data/games';
import styles from './BoardPreviewModal.module.css';

interface GameData {
  id: number;
  name: string;
  variant: number;
  freeSpace: boolean;
  totalNumbers?: number;
}

interface BoardPreviewModalProps {
  isVisible: boolean;
  onClose: () => void;
  gameData: GameData;
  rotationIndex?: number;
  cachedPatterns?: number[][][][] | null;
  onFreeSpaceToggle?: (freeSpace: boolean) => void;
  settingsVersion?: number;
  showFreeSpaceToggle?: boolean;
  showRules?: boolean;
}

// Board Preview Modal Component
const BoardPreviewModal: React.FC<BoardPreviewModalProps> = ({
  isVisible,
  onClose,
  gameData,
  rotationIndex = 0,
  cachedPatterns = null,
  onFreeSpaceToggle,
  settingsVersion = 0,
  showFreeSpaceToggle = true,
  showRules = true
}) => {
  if (!isVisible) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Close modal when clicking anywhere except interactive elements
    onClose();
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    // Allow clicks to bubble up to close the modal by default
    // Interactive elements will stop propagation in their own handlers
  };

  const renderModalBoardPreview = () => {
    try {
      const gamesList = games();
      const currentGame = gamesList[gameData.id];

      if (!currentGame || !currentGame.variants || !currentGame.variants[gameData.variant]) {
        return (
          <div className={styles.modalMiniGrid}>
            {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
              <div key={letter} className={styles.modalMiniCell}>
                {letter}
              </div>
            ))}
          </div>
        );
      }

      const currentVariant = currentGame.variants[gameData.variant];

      // Use cached patterns if available, otherwise generate patterns for preview
      let filteredPatterns: number[][][];

      if (cachedPatterns && cachedPatterns.length > 0) {
        // Use rotating patterns from cache
        filteredPatterns = cachedPatterns.map((possiblePatterns: number[][][]) => {
          const selectedPattern = possiblePatterns[rotationIndex % possiblePatterns.length];
          return selectedPattern;
        });
      } else {
        // Fallback: generate patterns for preview mode
        const boardPatterns = currentVariant.boards.map((boardFunction: any) => {
          if (typeof boardFunction === 'function') {
            const possiblePatterns = boardFunction(gameData.freeSpace, true);
            return possiblePatterns[0]; // Use first pattern for preview
          }
          return boardFunction;
        });

        filteredPatterns = boardPatterns;
      }

      const isDualBoard = filteredPatterns.length > 1;

      return (
        <div className={`${styles.modalGameBoardsContainer} ${isDualBoard ? styles.dualBoard : styles.singleBoard}`}>
          {filteredPatterns.map((pattern: number[][], index: number) => (
            <React.Fragment key={`modal-${index}-${settingsVersion}`}>
              <GameBoard
                board={pattern}
                freeSpace={gameData.freeSpace}
                size="large"
              />
              {index < filteredPatterns.length - 1 && currentVariant.op && (
                <OperatorIcon operator={currentVariant.op} />
              )}
            </React.Fragment>
          ))}
        </div>
      );
    } catch (error) {
      console.error('Error rendering modal board preview:', error);
      return (
        <div className={styles.modalMiniGrid}>
          {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
            <div key={letter} className={styles.modalMiniCell}>
              {letter}
            </div>
          ))}
        </div>
      );
    }
  };

  const renderFreeSpaceToggle = () => {
    if (!showFreeSpaceToggle || !onFreeSpaceToggle) {
      return null;
    }

    try {
      const gamesList = games();
      const currentGame = gamesList[gameData.id];
      if (currentGame && currentGame.variants && currentGame.variants[gameData.variant]) {
        const currentVariant = currentGame.variants[gameData.variant];
        const hasDynamicFreeSpace = currentVariant && currentVariant.hasOwnProperty('dynamicFreeSpace') && currentVariant.dynamicFreeSpace;

        if (hasDynamicFreeSpace) {
          return (
            <div className={styles.modalFreeSpaceToggle} onClick={(e) => e.stopPropagation()}>
              <FreeSpaceToggle
                freeSpace={gameData.freeSpace}
                onChange={onFreeSpaceToggle}
                variant={currentVariant}
              />
            </div>
          );
        }
      }
    } catch (error) {
      console.error('Error checking variant for free space toggle:', error);
    }
    return null;
  };

  const renderRulesCard = () => {
    if (!showRules) {
      return null;
    }

    try {
      const gamesList = games();
      const currentGame = gamesList[gameData.id];

      if (!currentGame || !currentGame.variants || !currentGame.variants[gameData.variant]) {
        return null;
      }

      const currentVariant = currentGame.variants[gameData.variant];
      const rules = currentVariant.rules;

      if (!rules) {
        return null;
      }

      return (
        <div className={styles.modalRulesCard} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalRulesHeader}>
            <h3>Game Rules</h3>
          </div>
          <div className={styles.modalRulesContent}>
            <p>{rules}</p>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering rules card:', error);
      return null;
    }
  };

  return (
    <div className={styles.boardPreviewModalOverlay} onClick={handleBackdropClick}>
      <div className={styles.boardPreviewModalContent} onClick={handleModalContentClick}>
        <div className={styles.modalHeader} onClick={handleBackdropClick}>
          <div className={styles.modalHeaderLeft} onClick={(e) => e.stopPropagation()}>
            <h2 onClick={handleBackdropClick}>{gameData.name}</h2>
            {renderFreeSpaceToggle()}
          </div>
          <button className={styles.modalCloseButton} onClick={onClose}>×</button>
        </div>
        {renderRulesCard()}
        <div className={styles.modalPreviewArea} onClick={handleBackdropClick}>
          {renderModalBoardPreview()}
        </div>
      </div>
    </div>
  );
};

export default BoardPreviewModal;
