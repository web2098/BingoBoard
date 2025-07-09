import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './board-page.css';
import SidebarWithMenu from '../../components/SidebarWithMenu';
import QRCode from '../../components/QRCode';
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
    <div className={`game-board ${isSelected ? 'selected' : ''}`} onClick={handleClick}>
      {[0, 1, 2, 3, 4].map((rowIndex) => (
        <div key={rowIndex} className="board-row">
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
                className={`board-cell ${isHighlightedCell ? 'highlighted' : ''} ${isFreeSpace ? 'free-space' : ''}`}
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
    <div className="operator-icon">
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
    <div className="free-space-toggle-mini" onClick={(e) => e.stopPropagation()}>
      <span className="toggle-label">Free Space:</span>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={freeSpace}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="slider"></span>
      </label>
      <span className="toggle-state">{freeSpace ? 'ON' : 'OFF'}</span>
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
          <div className="modal-mini-grid">
            {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
              <div key={letter} className="modal-mini-cell">
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
        <div className={`modal-game-boards-container ${isDualBoard ? 'dual-board' : 'single-board'}`}>
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
        <div className="modal-mini-grid">
          {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
            <div key={letter} className="modal-mini-cell">
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
            <div className="modal-free-space-toggle" onClick={(e) => e.stopPropagation()}>
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

  return (
    <div className="board-preview-modal-overlay" onClick={handleBackdropClick}>
      <div className="board-preview-modal-content" onClick={handleModalContentClick}>
        <div className="modal-header" onClick={handleBackdropClick}>
          <div className="modal-header-left" onClick={(e) => e.stopPropagation()}>
            <h2 onClick={handleBackdropClick}>{gameData.name}</h2>
            {renderFreeSpaceToggle()}
          </div>
          <button className="modal-close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-preview-area" onClick={handleBackdropClick}>
          {renderModalBoardPreview()}
        </div>
      </div>
    </div>
  );
};

const BoardPage: React.FC<BoardPageProps> = () => {
  const navigate = useNavigate();
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
    // Record in telemetry (handles both adding and removing)
    recordNumberCall(number);

    // Update local state
    const updatedNumbers = getLastCalledNumbers();
    const lastTelemetryNumber = getLastCalledNumber();

    setCalledNumbers(updatedNumbers);
    setLastNumber(lastTelemetryNumber);
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
    const newGameData = { ...gameData, freeSpace };
    setGameData(newGameData);

    // Update localStorage to persist the change
    localStorage.setItem('gameSettings', JSON.stringify(newGameData));
  };

  // Render the board preview based on current game selection
  const renderBoardPreview = () => {
    try {
      const gamesList = games();
      const currentGame = gamesList[gameData.id];

      if (!currentGame || !currentGame.variants || !currentGame.variants[gameData.variant]) {
        // Fallback to simple grid if game data is not available
        return (
          <div className="mini-grid clickable-preview" onClick={handlePreviewClick}>
            {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
              <div key={letter} className="mini-cell">
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
          className={`game-boards-container ${isDualBoard ? 'dual-board' : 'single-board'} clickable-preview`}
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
        <div className="mini-grid clickable-preview" onClick={handlePreviewClick}>
          {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
            <div key={letter} className="mini-cell">
              {letter}
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="board-page">
      <SidebarWithMenu
        currentPage="game-board"
        onReset={resetGame}
        pageButtons={pageButtons}
      />

      {/* Section 1: Header */}
      <div className="board-header">
        <div className="header-left">
          {/* Game Preview */}
          <div className="game-preview-mini">
            <div className="game-preview-header">
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
            <div className="mini-board">
              {renderBoardPreview()}
            </div>
            <p className="number-count">
              {calledNumbers.length}/{gameData.totalNumbers} numbers called
            </p>
          </div>
        </div>

        <div className="header-center">
          <div className="last-number-section">
            <div className="last-number-display">
              <div className="bingo-cards-group">
                {lastNumber ? (
                  <>
                    <span className="last-number-text">The Last Number Was</span>
                    <div className="bingo-letter-card" style={getLetterStyle(lastNumber)}>
                      {getBingoLetter(lastNumber)}
                    </div>
                    <div className="bingo-number-card">
                      {lastNumber}
                    </div>
                  </>
                ) : (
                  <span className="last-number-text">Waiting For First Number</span>
                )}
              </div>
            </div>
            <div className="special-callout-section">
                <p className="special-callout">{getSpecialCallout(lastNumber)}</p>
            </div>
          </div>
        </div>

        <div className="header-right">
          {/* QR Code */}
          <div className="qr-code-header">
            <h4>View On Your Device</h4>
            <QRCode
              value={`${window.location.origin}/BingoBoard/board`}
              size={170}
              className="board-qr-code"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Bingo Numbers Grid */}
      <div className="bingo-grid-section">
        <div className="grid-and-history-container">
          <div className="bingo-grid">
            {bingoGrid.map((row, rowIndex) => {
              const letter = row[0].letter;
              const backgroundColor = getLetterColor(letter);
              const textColor = getContrastTextColor(backgroundColor);

              return (
                <div key={`${rowIndex}-${settingsVersion}`} className="bingo-row">
                  <div
                    className="row-letter"
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
                        className={`bingo-cell ${cell.called ? 'called' : ''}`}
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

          <div className="number-history">
            <h4>Last Numbers Called</h4>
            <div className="history-list">
              {calledNumbers.slice().reverse().map((number, index) => (
                <div
                  key={number}
                  className={`history-item ${index === 0 ? 'most-recent' : ''}`}
                >
                  {number}
                </div>
              ))}
              {calledNumbers.length === 0 && (
                <div className="no-numbers">No numbers called yet</div>
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
