import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './client-page.module.css';
import QRCode from '../../components/QRCode';
import { useServerInteraction } from '../../serverInteractions/ServerInteractionContext';
import { getNumberMessage, getLetterColor, getContrastTextColor, getBoardHighlightColor } from '../../utils/settings';
import games from '../../data/games';

interface ClientPageProps {}

// Game Board Component for displaying 5x5 grids with bingo patterns (read-only for clients)
const GameBoard = ({
  board,
  freeSpace
}: {
  board: number[][],
  freeSpace: boolean
}) => {
  const letters = ['B', 'I', 'N', 'G', 'O'];

  // Create a 5x5 grid and mark highlighted cells
  const isHighlighted = (row: number, col: number): boolean => {
    return board.some(coord => coord[0] === row && coord[1] === col);
  };

  const boardHighlightColor = getBoardHighlightColor();
  const highlightTextColor = getContrastTextColor(boardHighlightColor);

  return (
    <div className={styles.gameBoard}>
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

const ClientPage: React.FC<ClientPageProps> = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  const serverUrl = searchParams.get('serverUrl');

  const {
    isConnected,
    connectionError,
    gameState,
    joinRoom
  } = useServerInteraction();

  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [gameData, setGameData] = useState<{
    id: number;
    name: string;
    variant: number;
    freeSpace: boolean;
    totalNumbers: number;
  } | null>(null);

  // State for pattern display
  const [cachedPatterns, setCachedPatterns] = useState<number[][][][] | null>(null);

  // State for letter colors
  const letterColors = {
    B: getLetterColor('B'),
    I: getLetterColor('I'),
    N: getLetterColor('N'),
    G: getLetterColor('G'),
    O: getLetterColor('O')
  };

  // Track if we've already initiated connection to prevent multiple calls
  const connectionInitiated = useRef(false);

  // Connect to server when component mounts
  useEffect(() => {
    if (roomId && serverUrl && !connectionInitiated.current) {
      console.log('Connecting to room:', roomId, 'on server:', serverUrl);
      connectionInitiated.current = true;
      joinRoom(serverUrl, roomId);
    }
  }, [roomId, serverUrl, joinRoom]);

  // Handle game state updates from server
  useEffect(() => {
    if (gameState) {
      const newGameData = {
        id: 0, // We don't have game ID from server, use default
        name: gameState.name,
        variant: 0, // We don't have variant from server, use default
        freeSpace: gameState.freeSpaceOn,
        totalNumbers: 75
      };
      setGameData(newGameData);
      // Use the gameState's called numbers and last number directly
      setCalledNumbers(gameState.calledNumbers);
      setLastNumber(gameState.lastNumber || null);
    }
  }, [gameState]);

  // Generate patterns for display when game data changes
  useEffect(() => {
    if (!gameData) {
      setCachedPatterns(null);
      return;
    }

    try {
      const gamesList = games();
      // Try to find the game by name since we don't have the exact ID
      const currentGame = gamesList.find(game => game.name === gameData.name) || gamesList[0];

      if (!currentGame || !currentGame.variants || !currentGame.variants[gameData.variant]) {
        setCachedPatterns(null);
        return;
      }

      const currentVariant = currentGame.variants[gameData.variant];
      let allPatterns: number[][][][] = [];

      // Generate patterns for each board
      currentVariant.boards.forEach((boardFunction: any) => {
        if (typeof boardFunction === 'function') {
          const possiblePatterns = boardFunction(gameData.freeSpace, false);
          allPatterns.push(possiblePatterns);
        }
      });

      // Apply filters if they exist
      if (currentVariant.filter) {
        allPatterns = currentVariant.filter(gameData.freeSpace, allPatterns);
      }

      setCachedPatterns(allPatterns);
    } catch (error) {
      console.error('Error setting up patterns for client:', error);
      setCachedPatterns(null);
    }
  }, [gameData]);

  // Get special callout message for a number (matches board page)
  const getSpecialCallout = (number: number | null) => {
    if (number === null) { return ""; }
    return getNumberMessage(number);
  };

  // Function to blend two hex colors
  const blendColors = (color1: string, color2: string, ratio: number): string => {
    // Remove # from hex colors
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');

    // Parse RGB values
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);

    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);

    // Blend the colors
    const r = Math.round(r1 * ratio + r2 * (1 - ratio));
    const g = Math.round(g1 * ratio + g2 * (1 - ratio));
    const b = Math.round(b1 * ratio + b2 * (1 - ratio));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Function to check if a number is called (read-only)
  const isNumberCalled = (number: number): boolean => {
    return calledNumbers.includes(number);
  };

  // Generate the bingo grid (5x15 with letters B,I,N,G,O) - read-only
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

  const bingoGrid = generateBingoGrid();

  // Get the Bingo letter for a number
  const getBingoLetter = (number: number): string => {
    const letters = ['B', 'I', 'N', 'G', 'O'];
    if (number >= 1 && number <= 15) return letters[0]; // B
    if (number >= 16 && number <= 30) return letters[1]; // I
    if (number >= 31 && number <= 45) return letters[2]; // N
    if (number >= 46 && number <= 60) return letters[3]; // G
    if (number >= 61 && number <= 75) return letters[4]; // O
    return '';
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

  // Render the board preview
  const renderBoardPreview = () => {
    if (!gameData) return null;

    try {
      const gamesList = games();
      const currentGame = gamesList.find(game => game.name === gameData.name) || gamesList[0];

      if (!currentGame || !currentGame.variants || !currentGame.variants[gameData.variant]) {
        return (
          <div className={styles.miniGrid}>
            {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
              <div key={letter} className={styles.miniCell}>
                {letter}
              </div>
            ))}
          </div>
        );
      }

      const currentVariant = currentGame.variants[gameData.variant];
      let filteredPatterns: number[][][];

      if (cachedPatterns) {
        // Use first pattern from cache
        filteredPatterns = cachedPatterns.map((possiblePatterns: number[][][]) => {
          return possiblePatterns[0] || [];
        });
      } else {
        // Fallback: generate patterns for preview mode
        const boardPatterns = currentVariant.boards.map((boardFunction: any) => {
          if (typeof boardFunction === 'function') {
            const possiblePatterns = boardFunction(gameData.freeSpace, true);
            return possiblePatterns[0];
          }
          return boardFunction;
        });
        filteredPatterns = boardPatterns;
      }

      const isDualBoard = filteredPatterns.length > 1;

      return (
        <div className={`${styles.gameBoardsContainer} ${isDualBoard ? styles.dualBoard : styles.singleBoard}`}>
          {filteredPatterns.map((pattern: number[][], index: number) => (
            <React.Fragment key={`client-${index}`}>
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
      return (
        <div className={styles.miniGrid}>
          {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
            <div key={letter} className={styles.miniCell}>
              {letter}
            </div>
          ))}
        </div>
      );
    }
  };

  // Show loading or error states
  if (!roomId || !serverUrl) {
    return (
      <div className={styles.clientPage}>
        <div className={styles.errorMessage}>
          <h2>Missing Connection Information</h2>
          <p>Room ID and Server URL are required to connect.</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className={styles.clientPage}>
        <div className={styles.errorMessage}>
          <h2>Connection Error</h2>
          <p>{connectionError}</p>
          <p>Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={styles.clientPage}>
        <div className={styles.loadingMessage}>
          <h2>Connecting...</h2>
          <p>Connecting to room {roomId}</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className={styles.clientPage}>
        <div className={styles.loadingMessage}>
          <h2>Waiting for Game Data...</h2>
          <p>Connected to room. Waiting for game setup.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.clientPage}>
      {/* Header */}
      <div className={styles.boardHeader}>
        <div className={styles.headerLeft}>
          {/* Game Preview */}
          <div className={styles.gamePreviewMini}>
            <div className={styles.gamePreviewHeader}>
              <h3>{gameData.name}</h3>
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
                {lastNumber ? (
                    <span className={styles.lastNumberText}>The Last Number Was</span>
                ) : (
                  <span className={styles.lastNumberText}>Waiting For First Number</span>
                )}
              <div className={styles.bingoCardsGroup}>
                {lastNumber ? (
                  <>
                    <div className={styles.bingoLetterCard} style={getLetterStyle(lastNumber)}>
                      {getBingoLetter(lastNumber)}
                    </div>
                    <div
                      className={styles.bingoNumberCard}
                      style={{
                        background: getBoardHighlightColor(),
                        color: getContrastTextColor(getBoardHighlightColor())
                      }}
                    >
                      {lastNumber}
                    </div>
                  </>
                ) : (
                  <div></div>
                )}
              </div>
            </div>
            <div className={styles.specialCalloutSection}>
              <p className={styles.specialCallout}>{getSpecialCallout(lastNumber)}</p>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.qrCodeHeader}>
            <h4>Share This View</h4>
            <div className={styles.qrCodeSuccess}>
              <div className={styles.qrCodeContainer}>
                <QRCode
                  value={`${window.location.origin}/BingoBoard/client?roomId=${roomId}&serverUrl=${encodeURIComponent(serverUrl || '')}`}
                  size={window.innerHeight <= 500 ? 100 : 140}
                  className={styles.boardQrCode}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bingo Numbers Grid */}
      <div className={styles.bingoGridSection}>
        <div className={styles.bingoGrid}>
          {bingoGrid.map((row, rowIndex) => {
            const letter = row[0].letter;
            const backgroundColor = getLetterColor(letter);
            const textColor = getContrastTextColor(backgroundColor);

            return (
              <div key={rowIndex} className={styles.bingoRow}>
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
                    >
                      {cell.number}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Horizontal Number History */}
      <div className={styles.numberHistorySection}>
        <h4>Recently Called Numbers</h4>
        <div className={styles.horizontalHistoryList}>
          {calledNumbers.length === 0 ? (
            <div className={styles.noNumbers}>No numbers called yet</div>
          ) : (
            calledNumbers.slice().reverse().map((number, index) => {
              // Get board colors for gradient effect
              const boardHighlightColor = getBoardHighlightColor();
              const unHighlightedColor = '#f0f0f0'; // Default cell background

              // Create gradient colors for first 3 numbers
              let backgroundColor = unHighlightedColor;
              let textColor = '#333';

              if (index === 0) {
                // Most recent: use highlighted color
                backgroundColor = boardHighlightColor;
                textColor = getContrastTextColor(boardHighlightColor);
              } else if (index === 1) {
                // Second most recent: 66% highlighted, 34% unhighlighted
                backgroundColor = blendColors(boardHighlightColor, unHighlightedColor, 0.66);
                textColor = getContrastTextColor(backgroundColor);
              } else if (index === 2) {
                // Third most recent: 33% highlighted, 67% unhighlighted
                backgroundColor = blendColors(boardHighlightColor, unHighlightedColor, 0.33);
                textColor = getContrastTextColor(backgroundColor);
              }

              return (
                <div
                  key={number}
                  className={styles.historyNumber}
                  style={{
                    backgroundColor,
                    color: textColor
                  }}
                >
                  {number}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientPage;
