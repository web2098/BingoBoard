import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './board-page.module.css';
import SidebarWithMenu from '../../components/SidebarWithMenu';
import QRCode from '../../components/QRCode';
import { useServerInteraction } from '../../serverInteractions/ServerInteractionContext';
import { GameState, StyleConfig, SessionConfig } from '../../serverInteractions/types';
import { getNumberMessage, getSetting, getLetterColor, getContrastTextColor, getBoardHighlightColor } from '../../utils/settings';
import games from '../../data/games';
import {
  startGameSession,
  recordNumberCall,
  resetGameSession,
  endCurrentSession,
  getCurrentSession,
  getLastCalledNumbers,
  getLastCalledNumber,
  isNumberCalled
} from '../../utils/telemetry';

interface BoardPageProps {}

// Game Board Component for displaying 5x5 grids with bingo patterns
const GameBoard = ({
  board,
  freeSpace,
  isSelected = false,
  onClick
}: {
  board: number[][],
  freeSpace: boolean,
  isSelected?: boolean,
  onClick?: () => void
}) => {
  const letters = ['B', 'I', 'N', 'G', 'O'];

  const handleClick = () => {
    if (onClick) onClick();
  };

  // Create a 5x5 grid and mark highlighted cells
  const isHighlighted = (row: number, col: number): boolean => {
    return board.some(coord => coord[0] === row && coord[1] === col);
  };

  const boardHighlightColor = getBoardHighlightColor();
  const highlightTextColor = getContrastTextColor(boardHighlightColor);

  return (
    <div className={`${styles.gameBoard} ${isSelected ? styles.selected : ''}`} onClick={handleClick}>
      {[0, 1, 2, 3, 4].map((rowIndex) => (
        <div key={rowIndex} className={styles.boardRow}>
          {[0, 1, 2, 3, 4].map((colIndex) => {
            const isHighlightedCell = isHighlighted(rowIndex, colIndex);
            const isFreeSpace = rowIndex === 2 && colIndex === 2;

            // Dynamic styling for highlighted cells
            const cellStyle = isHighlightedCell ? {
              backgroundColor: boardHighlightColor,
              color: highlightTextColor
            } : {};

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`${styles.boardCell} ${isHighlightedCell ? styles.highlighted : ''} ${isFreeSpace ? styles.freeSpace : ''}`}
                style={cellStyle}
              >
                {isFreeSpace ? (freeSpace ? 'FREE' : letters[colIndex]) : letters[colIndex]}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Operator Icon Component for dual board games
const OperatorIcon = ({ operator }: { operator: string }) => {
  const getOperatorSymbol = () => {
    switch (operator.toUpperCase()) {
      case 'AND': return 'AND';
      case 'OR': return 'OR';
      case 'TRANSITION': return 'INTO';
      default: return operator;
    }
  };

  return (
    <div className={styles.operatorIcon}>
      {getOperatorSymbol()}
    </div>
  );
};

// Free Space Toggle Component for board preview
const FreeSpaceToggle = ({
  freeSpace,
  onChange,
  variant
}: {
  freeSpace: boolean,
  onChange: (value: boolean) => void,
  variant?: any
}) => {
  // Toggle should only be shown if dynamicFreeSpace is available
  const hasDynamicFreeSpace = variant && variant.hasOwnProperty('dynamicFreeSpace') && variant.dynamicFreeSpace;

  if (!hasDynamicFreeSpace) {
    return null;
  }

  return (
    <div className={styles.freeSpaceToggleMini} onClick={(e) => e.stopPropagation()}>
      <span className={styles.toggleLabel}>Free Space:</span>
      <label className={styles.toggleSwitch}>
        <input
          type="checkbox"
          checked={freeSpace}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.slider}></span>
      </label>
      <span className={styles.toggleState}>{freeSpace ? 'ON' : 'OFF'}</span>
    </div>
  );
};

// Board Preview Modal Component
const BoardPreviewModal = ({
  isVisible,
  onClose,
  gameData,
  rotationIndex,
  cachedPatterns,
  onFreeSpaceToggle,
  settingsVersion
}: {
  isVisible: boolean,
  onClose: () => void,
  gameData: any,
  rotationIndex: number,
  cachedPatterns: number[][][][] | null,
  onFreeSpaceToggle: (freeSpace: boolean) => void,
  settingsVersion: number
}) => {
  if (!isVisible) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Close modal when clicking anywhere except the free space toggle
    onClose();
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    // Allow clicks to bubble up to close the modal by default
    // The free space toggle will stop propagation in its own handler
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
          </div>          <button className={styles.modalCloseButton} onClick={onClose}>×</button>
        </div>
        {renderRulesCard()}
        <div className={styles.modalPreviewArea} onClick={handleBackdropClick}>
          {renderModalBoardPreview()}
        </div>
      </div>
    </div>
  );
};

const BoardPage: React.FC<BoardPageProps> = () => {
  const navigate = useNavigate();
  const {
    isConnected,
    roomId,
    isHost,
    connectionError,
    sendNumberActivated,
    sendNumberDeactivated,
    sendGameSetup,
    sendFreeSpaceUpdate
  } = useServerInteraction();
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [gameData, setGameData] = useState({
    id: 0,
    name: "Traditional Bingo",
    variant: 0,
    freeSpace: true,
    totalNumbers: 75
  });

  // State for pattern rotation functionality
  const [rotationIndex, setRotationIndex] = useState(0);
  const [cachedPatterns, setCachedPatterns] = useState<number[][][][] | null>(null);
  const [hasMultiplePatterns, setHasMultiplePatterns] = useState(false);

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);

  // State for letter colors (will update when settings change)
  const [letterColors, setLetterColors] = useState({
    B: getLetterColor('B'),
    I: getLetterColor('I'),
    N: getLetterColor('N'),
    G: getLetterColor('G'),
    O: getLetterColor('O')
  });

  // State for triggering board re-renders when highlight color changes
  const [settingsVersion, setSettingsVersion] = useState(0);

  // Modal handlers
  const handlePreviewClick = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  // Game options handlers with telemetry integration
  const handleResetBoard = () => {
    resetGameSession();
    setCalledNumbers([]);
    setLastNumber(null);
  };

  const handleSelectNewGame = () => {
    endCurrentSession();
    navigate('/BingoBoard/select-game');
  };

  const handleEndNight = () => {
    endCurrentSession();
    navigate('/BingoBoard/telemetry');
  };

  // Define page buttons for the sidebar
  const pageButtons = [
    {
      id: 'reset-board',
      label: 'Reset Board',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23,4 23,10 17,10"/>
          <polyline points="1,20 1,14 7,14"/>
          <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10"/>
          <path d="M3.51,15a9,9,0,0,0,14.85,3.36L23,14"/>
        </svg>
      ),
      onClick: handleResetBoard,
      className: 'reset-settings-button'
    },
    {
      id: 'new-game',
      label: 'New Game',
      icon: '🎮',
      onClick: handleSelectNewGame,
      className: 'new-game-button'
    },
    {
      id: 'end-night',
      label: 'End Night',
      icon: '🌙',
      onClick: handleEndNight,
      className: 'end-night-button'
    }
  ];

  // Load game settings from localStorage and initialize telemetry
  useEffect(() => {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      const gameConfig = {
        id: settings.id || 0,
        name: settings.name || "Traditional Bingo",
        variant: settings.variant || 0,
        freeSpace: settings.freeSpace,
        totalNumbers: 75
      };

      setGameData(gameConfig);

      // Initialize telemetry session
      const currentSession = getCurrentSession();
      if (!currentSession ||
          currentSession.gameId !== gameConfig.id ||
          currentSession.variant !== gameConfig.variant ||
          currentSession.freeSpace !== gameConfig.freeSpace) {
        // Start new session if no current session or game changed
        startGameSession(
          gameConfig.id,
          gameConfig.name,
          gameConfig.variant,
          gameConfig.freeSpace,
          gameConfig.totalNumbers
        );
      }

      // Load called numbers from telemetry
      const telemetryNumbers = getLastCalledNumbers();
      const lastTelemetryNumber = getLastCalledNumber();

      setCalledNumbers(telemetryNumbers);
      setLastNumber(lastTelemetryNumber);
    } else {
      // Initialize telemetry session for default game
      startGameSession(0, "Traditional Bingo", 0, true, 75);
    }
  }, []);

  // Sync game state with server when connected as host
  useEffect(() => {
    if (isConnected && isHost && gameData && calledNumbers) {
      // Send current game state to all clients
      const gameState: GameState = {
        name: gameData.name,
        freeSpaceOn: gameData.freeSpace,
        calledNumbers: calledNumbers,
        lastNumber: lastNumber || undefined
      };

      const styleConfig: StyleConfig = {
        selectedColor: getSetting('boardHighlightColor', '#1e4d2b'),
        selectedTextColor: getSetting('highlightTextColor', '#ffffff'),
        unselectedColor: getSetting('backgroundColor', '#ffffff'),
        unselectedTextColor: getSetting('textColor', '#000000')
      };

      const sessionConfig: SessionConfig = {
        specialNumbers: JSON.parse(localStorage.getItem('specialNumbers') || '{}')
      };

      sendGameSetup(gameState, styleConfig, sessionConfig);
    }
  }, [isConnected, isHost, gameData, calledNumbers, lastNumber, sendGameSetup]);

  // Cleanup effect to end session when component unmounts
  useEffect(() => {
    return () => {
      // Only end session if we're actually leaving the app, not just re-rendering
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/BingoBoard/board')) {
        endCurrentSession();
      }
    };
  }, []);

  // Effect to handle page visibility changes and save session state
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden - save current state but don't end session
        // This handles tab switches, minimizing, etc.
        console.log('Page hidden - session state saved');
      }
    };

    const handleBeforeUnload = () => {
      // Browser is closing or navigating away - end the session
      endCurrentSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Effect to handle settings changes for letter colors and board highlight
  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent) => {
      const { id } = event.detail;
      // Update letter colors if any letter color setting changed
      if (['bLetterColor', 'iLetterColor', 'nLetterColor', 'gLetterColor', 'oLetterColor'].includes(id)) {
        setLetterColors({
          B: getLetterColor('B'),
          I: getLetterColor('I'),
          N: getLetterColor('N'),
          G: getLetterColor('G'),
          O: getLetterColor('O')
        });
      }
      // Trigger re-render for board highlight color changes
      if (id === 'boardHighlightColor') {
        setSettingsVersion(prev => prev + 1);
      }
    };

    window.addEventListener('bingoSettingsChanged', handleSettingsChange as EventListener);

    return () => {
      window.removeEventListener('bingoSettingsChanged', handleSettingsChange as EventListener);
    };
  }, []);

  // Effect to handle pattern rotation for preview
  useEffect(() => {
    try {
      const gamesList = games();
      const currentGame = gamesList[gameData.id];

      if (!currentGame || !currentGame.variants || !currentGame.variants[gameData.variant]) {
        setCachedPatterns(null);
        setHasMultiplePatterns(false);
        return;
      }

      const currentVariant = currentGame.variants[gameData.variant];
      let allPatterns: number[][][][] = [];
      let hasMultiple = false;

      // Generate patterns for each board
      currentVariant.boards.forEach((boardFunction: any) => {
        if (typeof boardFunction === 'function') {
          const possiblePatterns = boardFunction(gameData.freeSpace, false); // Don't use preview mode for rotation
          allPatterns.push(possiblePatterns);
          if (possiblePatterns.length > 1) {
            hasMultiple = true;
          }
        }
      });

      // Apply filters if they exist
      if (currentVariant.filter) {
        allPatterns = currentVariant.filter(gameData.freeSpace, allPatterns);
      }

      setCachedPatterns(allPatterns);
      setHasMultiplePatterns(hasMultiple);
      setRotationIndex(0);

      // Set up rotation interval if there are multiple patterns
      if (hasMultiple) {
        const intervalSeconds = getSetting('patternRotationInterval', 3);
        const intervalMs = intervalSeconds * 1000;

        const rotationInterval = setInterval(() => {
          const maxPatterns = Math.max(...allPatterns.map(patterns => patterns.length));
          setRotationIndex(prevIndex => (prevIndex + 1) % maxPatterns);
        }, intervalMs);

        return () => {
          clearInterval(rotationInterval);
        };
      }
    } catch (error) {
      console.error('Error setting up pattern rotation:', error);
      setCachedPatterns(null);
      setHasMultiplePatterns(false);
    }
  }, [gameData.id, gameData.variant, gameData.freeSpace]);

  // Generate the bingo grid (5x15 with letters B,I,N,G,O)
  const generateBingoGrid = () => {
    const letters = ['B', 'I', 'N', 'G', 'O'];
    const grid = [];

    for (let row = 0; row < 5; row++) {
      const rowData = [];
      for (let col = 0; col < 15; col++) {
        const number = row * 15 + col + 1;
        rowData.push({
          number,
          letter: letters[row],
          called: isNumberCalled(number)
        });
      }
      grid.push(rowData);
    }
    return grid;
  };

  // Use settingsVersion as a dependency to force re-renders when highlight color changes
  const bingoGrid = generateBingoGrid();

  const handleNumberClick = (number: number) => {
    // Only hosts can click numbers when connected to server
    if (isConnected && !isHost) {
      return; // Clients cannot click numbers
    }

    // Check if number was already called before the action
    const wasAlreadyCalled = isNumberCalled(number);

    // Record in telemetry (handles both adding and removing)
    recordNumberCall(number);

    // Update local state
    const updatedNumbers = getLastCalledNumbers();
    const lastTelemetryNumber = getLastCalledNumber();

    setCalledNumbers(updatedNumbers);
    setLastNumber(lastTelemetryNumber);

    // Send server updates if connected and host
    if (isConnected && isHost) {
      const totalSpots = updatedNumbers.length;

      if (wasAlreadyCalled) {
        // Number was uncalled
        sendNumberDeactivated(number, totalSpots);
      } else {
        // Number was called
        sendNumberActivated(number, totalSpots);
      }
    }
  };

  const getSpecialCallout = (number: number | null) => {
    if( number === null ){ return "";}
    return getNumberMessage(number);
  };

  const resetGame = () => {
    resetGameSession();
    setCalledNumbers([]);
    setLastNumber(null);
  };

  // Get the Bingo letter for a number
  const getBingoLetter = (number: number): string => {
    const letters = ['B', 'I', 'N', 'G', 'O'];
    // Numbers 1-15 = B, 16-30 = I, 31-45 = N, 46-60 = G, 61-75 = O
    if (number >= 1 && number <= 15) return letters[0]; // B
    if (number >= 16 && number <= 30) return letters[1]; // I
    if (number >= 31 && number <= 45) return letters[2]; // N
    if (number >= 46 && number <= 60) return letters[3]; // G
    if (number >= 61 && number <= 75) return letters[4]; // O
    return ''; // Invalid number
  };

  // Get letter color information for styling
  const getLetterStyle = (number: number) => {
    const letter = getBingoLetter(number);
    const backgroundColor = letterColors[letter as keyof typeof letterColors] || getLetterColor(letter);
    const textColor = getContrastTextColor(backgroundColor);

    return {
      backgroundColor,
      color: textColor
    };
  };

  // Handle free space toggle
  const handleFreeSpaceToggle = (freeSpace: boolean) => {
    // Only hosts can change free space when connected to server
    if (isConnected && !isHost) {
      return; // Clients cannot change settings
    }

    const newGameData = { ...gameData, freeSpace };
    setGameData(newGameData);

    // Update localStorage to persist the change
    localStorage.setItem('gameSettings', JSON.stringify(newGameData));

    // Send server update if connected and host
    if (isConnected && isHost) {
      sendFreeSpaceUpdate(freeSpace);
    }
  };

  // Render the board preview based on current game selection
  const renderBoardPreview = () => {
    try {
      const gamesList = games();
      const currentGame = gamesList[gameData.id];

      if (!currentGame || !currentGame.variants || !currentGame.variants[gameData.variant]) {
        // Fallback to simple grid if game data is not available
        return (
          <div className={`${styles.miniGrid} ${styles.clickablePreview}`} onClick={handlePreviewClick}>
            {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
              <div key={letter} className={styles.miniCell}>
                {letter}
              </div>
            ))}
          </div>
        );
      }

      const currentVariant = currentGame.variants[gameData.variant];

      // Use cached patterns if available, otherwise generate patterns for preview
      let filteredPatterns: number[][][];

      if (cachedPatterns && hasMultiplePatterns) {
        // Use rotating patterns from cache
        filteredPatterns = cachedPatterns.map((possiblePatterns: number[][][]) => {
          const selectedPattern = possiblePatterns[rotationIndex % possiblePatterns.length];
          return selectedPattern;
        });
      } else if (cachedPatterns) {
        // Use first pattern from cache (no rotation needed)
        filteredPatterns = cachedPatterns.map((possiblePatterns: number[][][]) => {
          return possiblePatterns[0] || [];
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

        // Apply any filters if they exist
        filteredPatterns = boardPatterns;
        if (currentVariant.filter) {
          try {
            const allPatternsForFilter = currentVariant.boards.map((boardFunction: any) => {
              if (typeof boardFunction === 'function') {
                return boardFunction(gameData.freeSpace, true);
              }
              return [boardFunction];
            });

            const filterResult = currentVariant.filter(gameData.freeSpace, allPatternsForFilter);

            // Extract the first pattern from each board for preview
            filteredPatterns = filterResult.map((boardPatterns: number[][][]) => {
              return boardPatterns.length > 0 ? boardPatterns[0] : [];
            });
          } catch (filterError) {
            console.error('Error applying filter in preview mode:', filterError);
            // Fallback to unfiltered patterns
            filteredPatterns = boardPatterns;
          }
        }
      }

      const isDualBoard = filteredPatterns.length > 1;

      return (
        <div
          className={`${styles.gameBoardsContainer} ${isDualBoard ? styles.dualBoard : styles.singleBoard} ${styles.clickablePreview}`}
          onClick={handlePreviewClick}
        >
          {filteredPatterns.map((pattern: number[][], index: number) => (
            <React.Fragment key={`main-${index}-${settingsVersion}`}>
              <GameBoard
                board={pattern}
                freeSpace={gameData.freeSpace}
              />
              {index < filteredPatterns.length - 1 && currentVariant.op && (
                <OperatorIcon operator={currentVariant.op} />
              )}
            </React.Fragment>
          ))}
        </div>
      );
    } catch (error) {
      console.error('Error rendering board preview:', error);
      // Fallback to simple grid on error
      return (
        <div className={`${styles.miniGrid} ${styles.clickablePreview}`} onClick={handlePreviewClick}>
          {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
            <div key={letter} className={styles.miniCell}>
              {letter}
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className={styles.boardPage}>
      <SidebarWithMenu
        currentPage="game-board"
        onReset={resetGame}
        pageButtons={pageButtons}
      />

      {/* Section 1: Header */}
      <div className={styles.boardHeader}>
        <div className={styles.headerLeft}>
          {/* Game Preview */}
          <div className={styles.gamePreviewMini}>
            <div className={styles.gamePreviewHeader}>
              <h3>{gameData.name}</h3>
              {(() => {
                try {
                  const gamesList = games();
                  const currentGame = gamesList[gameData.id];
                  if (currentGame && currentGame.variants && currentGame.variants[gameData.variant]) {
                    const currentVariant = currentGame.variants[gameData.variant];
                    return (
                      <FreeSpaceToggle
                        freeSpace={gameData.freeSpace}
                        onChange={handleFreeSpaceToggle}
                        variant={currentVariant}
                      />
                    );
                  }
                } catch (error) {
                  console.error('Error checking variant for free space toggle:', error);
                }
                return null;
              })()}
            </div>
            <div className={styles.miniBoard}>
              {renderBoardPreview()}
            </div>
            <p className={styles.numberCount}>
              {calledNumbers.length}/{gameData.totalNumbers} ({gameData.totalNumbers - calledNumbers.length} Left)
            </p>
          </div>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.lastNumberSection}>
            <div className={styles.lastNumberDisplay}>
              <div className={styles.bingoCardsGroup}>
                {lastNumber ? (
                  <>
                    <span className={styles.lastNumberText}>The Last Number Was</span>
                    <div className={styles.bingoLetterCard} style={getLetterStyle(lastNumber)}>
                      {getBingoLetter(lastNumber)}
                    </div>
                    <div className={styles.bingoNumberCard}>
                      {lastNumber}
                    </div>
                  </>
                ) : (
                  <span className={styles.lastNumberText}>Waiting For First Number</span>
                )}
              </div>
            </div>
            <div className={styles.specialCalloutSection}>
                <p className={styles.specialCallout}>{getSpecialCallout(lastNumber)}</p>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* QR Code section with server status logic */}
          {(() => {
            // Check server settings
            const serverUrl = getSetting('serverUrl', '');
            const authToken = getSetting('serverAuthToken', '');
            const hasServerSettings = serverUrl.trim() !== '' && authToken.trim() !== '';

            if (!hasServerSettings) {
              return (
                <div className={styles.qrCodeHeader}>
                  <h4>View On Your Device</h4>
                  <div className={styles.qrCodeMessage}>
                    <div className={styles.statusIcon}>⚠️</div>
                    <p>Server settings missing</p>
                    <p className={styles.statusDetail}>Configure server URL and auth token to enable multiplayer</p>
                    <a href="/BingoBoard/settings?expand=bingo-server-settings" className={styles.settingsLink}>Configure Server Settings</a>
                  </div>
                </div>
              );
            }

            if (connectionError) {
              return (
                <div className={styles.qrCodeHeader}>
                  <h4>View On Your Device</h4>
                  <div className={`${styles.qrCodeMessage} ${styles.error}`}>
                    <div className={styles.statusIcon}>❌</div>
                    <p>Server connection failed</p>
                    <p className={styles.statusDetail}>{connectionError}</p>
                    <p className={styles.statusHint}>Check if server is running and settings are correct</p>
                  </div>
                </div>
              );
            }

            if (!isConnected) {
              return (
                <div className={styles.qrCodeHeader}>
                  <h4>View On Your Device</h4>
                  <div className={`${styles.qrCodeMessage} ${styles.connecting}`}>
                    <div className={styles.statusIcon}>🔄</div>
                    <p>Connecting to server...</p>
                    <p className={styles.statusDetail}>Attempting to establish connection</p>
                  </div>
                </div>
              );
            }

            if (isConnected && roomId) {
              return (
                <div className={styles.qrCodeHeader}>
                  <h4>View On Your Device</h4>
                  <div className={styles.qrCodeSuccess}>
                    <div className={styles.qrCodeContainer}>
                      <QRCode
                        value={`${window.location.origin}/BingoBoard/board?roomId=${roomId}`}
                        size={170}
                        className={styles.boardQrCode}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            // Connected but no room ID yet
            return (
              <div className={styles.qrCodeHeader}>
                <h4>View On Your Device</h4>
                <div className={`${styles.qrCodeMessage} ${styles.connecting}`}>
                  <div className={styles.statusIcon}>🔄</div>
                  <p>Setting up room...</p>
                  <p className={styles.statusDetail}>Connected to server, creating room</p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Section 2: Bingo Numbers Grid */}
      <div className={styles.bingoGridSection}>
        <div className={styles.gridAndHistoryContainer}>
          <div className={styles.bingoGrid}>
            {bingoGrid.map((row, rowIndex) => {
              const letter = row[0].letter;
              const backgroundColor = getLetterColor(letter);
              const textColor = getContrastTextColor(backgroundColor);

              return (
                <div key={`${rowIndex}-${settingsVersion}`} className={styles.bingoRow}>
                  <div
                    className={styles.rowLetter}
                    style={{
                      backgroundColor: backgroundColor,
                      color: textColor
                    }}
                  >
                    {letter}
                  </div>
                  {row.map((cell) => {
                    // Dynamic styling for called cells
                    const boardHighlightColor = getBoardHighlightColor();

                    // Create a slightly darker border color by reducing brightness
                    const darkerBorderColor = boardHighlightColor.replace('#', '').match(/.{2}/g)?.map(hex => {
                      const num = parseInt(hex, 16);
                      const darker = Math.max(0, num - 30); // Reduce by 30 for darker shade
                      return darker.toString(16).padStart(2, '0');
                    }).join('');

                    const cellStyle = cell.called ? {
                      backgroundColor: boardHighlightColor,
                      color: getContrastTextColor(boardHighlightColor),
                      borderColor: `#${darkerBorderColor}`
                    } : {};

                    return (
                      <div
                        key={cell.number}
                        className={`${styles.bingoCell} ${cell.called ? styles.called : ''}`}
                        style={cellStyle}
                        onClick={() => handleNumberClick(cell.number)}
                      >
                        {cell.number}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className={styles.numberHistory}>
            <h4>Last Numbers Called</h4>
            <div className={styles.historyList}>
              {calledNumbers.slice().reverse().map((number, index) => (
                <div
                  key={number}
                  className={`${styles.historyItem} ${index === 0 ? styles.mostRecent : ''}`}
                >
                  {number}
                </div>
              ))}
              {calledNumbers.length === 0 && (
                <div className={styles.noNumbers}>No numbers called yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Board Preview Modal - Controlled by BoardPage state */}
      <BoardPreviewModal
        isVisible={isModalVisible}
        onClose={handleModalClose}
        gameData={gameData}
        rotationIndex={rotationIndex}
        cachedPatterns={cachedPatterns}
        onFreeSpaceToggle={handleFreeSpaceToggle}
        settingsVersion={settingsVersion}
      />
    </div>
  );
};

export default BoardPage;
