import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './board-page.module.css';
import SidebarWithMenu from '../../components/SidebarWithMenu';
import QRCode from '../../components/QRCode';
import { BoardPreviewModal, GameBoard, OperatorIcon, FreeSpaceToggle } from '../../components/boards';
import { useServerInteraction } from '../../serverInteractions/useServerInteraction';
import ServerInteractionService from '../../serverInteractions/ServerInteractionService';
import { GameState, StyleConfig, SessionConfig, AudienceInteractionType, AudienceInteractionOptions } from '../../serverInteractions/types';
import { getNumberMessage, getSetting, getLetterColor, getContrastTextColor, getBoardHighlightColor } from '../../utils/settings';
import { getVersionRoute, resolveVersionAlias } from '../../config/versions';
import games from '../../data/games';
import {
  startGameSession,
  recordNumberCall,
  resetGameSession,
  endCurrentSession,
  getCurrentSession,
  getLastCalledNumbers,
  getLastCalledNumbersReversed,
  getLastCalledNumber,
  isNumberCalled,
  updateFreeSpaceSetting
} from '../../utils/telemetry';

interface BoardPageProps {}

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
    sendFreeSpaceUpdate,
    sendAudienceInteraction
    // sendModalDeactivate - not used in this component
  } = useServerInteraction({
    autoConnect: true, // Enable auto-connection for host pages
    autoConnectRetryInterval: getSetting('connectionTimeout', 10)
  });

  // Create a stable callback wrapper
  const handleAudienceInteraction = useCallback((eventType: AudienceInteractionType, options: AudienceInteractionOptions = {}) => {
    if (sendAudienceInteraction) {
      sendAudienceInteraction(eventType, options);
    } else {
      console.error('Board page - sendAudienceInteraction is not available');
    }
  }, [sendAudienceInteraction]);
  // Helper functions to get current state from telemetry
  const getCalledNumbers = () => getLastCalledNumbers();
  const getLastNumber = () => getLastCalledNumber();

  // Force component re-render when telemetry data changes
  const [refreshKey, setRefreshKey] = useState(0);
  const forceRefresh = () => setRefreshKey(prev => prev + 1);
  const [gameData, setGameData] = useState<{
    id: number;
    name: string;
    variant: number;
    freeSpace: boolean;
    totalNumbers: number;
  } | null>(null);

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

  // Ref to track if initial game setup has been sent to avoid multiple sends during component initialization
  const initialSetupSent = useRef(false);
  const lastSentGameConfig = useRef<string | null>(null);

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
    forceRefresh(); // Trigger re-render after reset
    // State is now managed by telemetry - no local state to clear

    // Reset tracking to ensure game setup is sent after reset
    initialSetupSent.current = false;
    lastSentGameConfig.current = null;

    // Send updated game state to clients if connected as host
    if (isConnected && isHost && gameData) {
      const gameState: GameState = {
        name: gameData.name,
        freeSpaceOn: gameData.freeSpace,
        calledNumbers: getCalledNumbers(), // Get current state from telemetry
        lastNumber: getLastNumber() || undefined // Get current state from telemetry
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

      console.log("Sending game setup after reset");
      sendGameSetup(gameState, styleConfig, sessionConfig);
    }
  };

  const handleSelectNewGame = () => {
    endCurrentSession();
    navigate('/select-game');
  };

  const handleEndNight = () => {
    endCurrentSession();
    navigate('/telemetry');
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
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5"/>
          <path d="M12 19l-7-7 7-7"/>
        </svg>
      ),
      onClick: handleSelectNewGame,
      className: 'newGameButton'
    },
    {
      id: 'end-night',
      label: 'End Night',
      icon: '🌙',
      onClick: handleEndNight,
      className: 'endNightButton'
    }
  ];

  // Load game settings from localStorage and initialize telemetry
  useEffect(() => {
    const savedSettings = localStorage.getItem('gameSettings');
    let gameConfig;

    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      gameConfig = {
        id: settings.id || 0,
        name: settings.name || "Traditional Bingo",
        variant: settings.variant || 0,
        freeSpace: settings.freeSpace,
        totalNumbers: 75
      };
    } else {
      // Use default game configuration
      gameConfig = {
        id: 0,
        name: "Traditional Bingo",
        variant: 0,
        freeSpace: true,
        totalNumbers: 75
      };
    }

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

    // Called numbers are now loaded directly from telemetry when needed
    // No need to sync local state since telemetry is the source of truth
  }, []);

  // Sync game state with server when connected as host
  useEffect(() => {
    if (isConnected && isHost && gameData) {
      // Create a unique identifier for the current game configuration
      const currentGameConfig = JSON.stringify({
        id: gameData.id,
        name: gameData.name,
        variant: gameData.variant,
        freeSpace: gameData.freeSpace
      });

      // Check if this is a new connection or a meaningful game change that requires setup
      const shouldSendSetup = !initialSetupSent.current || lastSentGameConfig.current !== currentGameConfig;

      if (shouldSendSetup) {
        // Get current state for setup - use reversed order to match v4 expectations
        const currentCalledNumbers = getLastCalledNumbersReversed();
        const currentLastNumber = getLastCalledNumber();

        // Send current game state to all clients
        const gameState: GameState = {
          name: gameData.name,
          freeSpaceOn: gameData.freeSpace,
          calledNumbers: currentCalledNumbers,
          lastNumber: currentLastNumber || undefined
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
        initialSetupSent.current = true;
        lastSentGameConfig.current = currentGameConfig;
      }
    } else if (!isConnected) {
      // Reset the flags when disconnected so we send setup again on reconnection
      initialSetupSent.current = false;
      lastSentGameConfig.current = null;
    }
  }, [gameData, isConnected, isHost, sendGameSetup]);

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
    if (!gameData) {
      setCachedPatterns(null);
      setHasMultiplePatterns(false);
      return;
    }

    try {
      // Check if rotation is enabled
      const rotationEnabled = getSetting('enablePatternRotation', true);

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
          // Use preview mode if rotation is disabled
          const possiblePatterns = boardFunction(gameData.freeSpace, !rotationEnabled);
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
      setHasMultiplePatterns(hasMultiple && rotationEnabled);
      setRotationIndex(0);

      // Set up rotation interval if there are multiple patterns and rotation is enabled
      if (hasMultiple && rotationEnabled) {
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
  }, [gameData, settingsVersion]);
  // Print QR code URL when roomId is established
  useEffect(() => {
    if (isConnected && roomId) {
      const serverUrl = getSetting('serverUrl', '');
      const currentVersion = getSetting('defaultVersion', 'latest');
      const resolvedVersion = resolveVersionAlias(currentVersion);
      const clientRoute = getVersionRoute(resolvedVersion, 'client');

      // Generate base64 parameters
      const base64Params = ServerInteractionService.generateClientParams(roomId, serverUrl);

      // Build the QR code URL using the version-specific client route with base64 params
      const qrCodeValue = `${window.location.origin}/BingoBoard/${resolvedVersion}${clientRoute.path}?params=${base64Params}`;
      console.log("QR Code URL:", qrCodeValue);
    }
  }, [roomId, isConnected]);

  // Use settingsVersion and refreshKey as dependencies to force re-renders when highlight color or telemetry data changes
  const bingoGrid = useMemo(() => {
    const letters = ['B', 'I', 'N', 'G', 'O'];
    const grid = [];

    for (let row = 0; row < 5; row++) {
      const rowData = [];
      for (let col = 0; col < 15; col++) {
        const number = row * 15 + col + 1;
        rowData.push({
          number,
          letter: letters[row],
          called: isNumberCalled(number) // This depends on telemetry data
        });
      }
      grid.push(rowData);
    }
    return grid;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, settingsVersion]); // refreshKey ensures re-calculation when telemetry changes

  // Early return if gameData is not yet loaded
  if (!gameData) {
    return <div className={styles.boardPage}>Loading...</div>;
  }

  const handleNumberClick = (number: number) => {
    // Only hosts can click numbers when connected to server
    if (isConnected && !isHost) {
      return; // Clients cannot click numbers
    }

    // Check if number was already called before the action
    const wasAlreadyCalled = isNumberCalled(number);

    // Record in telemetry (handles both adding and removing)
    recordNumberCall(number);
    forceRefresh(); // Trigger re-render after number change

    // No need to update local state - telemetry is the source of truth
    // The component will re-render when bingoGrid is regenerated

    // Send server updates if connected and host
    if (isConnected && isHost) {
      const currentNumbers = getLastCalledNumbers();
      const totalSpots = currentNumbers.length;

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
    forceRefresh(); // Trigger re-render after reset
    // State is now managed by telemetry - no local state to clear

    // Reset tracking to ensure game setup is sent after reset
    initialSetupSent.current = false;
    lastSentGameConfig.current = null;

    // Send updated game state to clients if connected as host
    if (isConnected && isHost && gameData) {
      const gameState: GameState = {
        name: gameData.name,
        freeSpaceOn: gameData.freeSpace,
        calledNumbers: getCalledNumbers(), // Get current state from telemetry
        lastNumber: getLastNumber() || undefined // Get current state from telemetry
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

      console.log("Sending game setup after game reset");
      sendGameSetup(gameState, styleConfig, sessionConfig);
    }
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

    if (!gameData) {
      return; // Cannot change if no game data
    }

    const newGameData = { ...gameData, freeSpace };
    setGameData(newGameData);

    // Update telemetry session with new free space setting
    updateFreeSpaceSetting(freeSpace);

    // Update localStorage to persist the change
    localStorage.setItem('gameSettings', JSON.stringify(newGameData));

    // Reset tracking so the configuration change is properly detected
    lastSentGameConfig.current = null;

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
                size="mini"
                isDualBoard={isDualBoard}
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
        onAudienceInteraction={handleAudienceInteraction}
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
              {getCalledNumbers().length}/{gameData.totalNumbers} ({gameData.totalNumbers - getCalledNumbers().length} Left)
            </p>
          </div>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.lastNumberSection}>
            <div className={styles.lastNumberDisplay}>
              <div className={styles.bingoCardsGroup}>
                {getLastNumber() ? (
                  <>
                    <span className={styles.lastNumberText}>The Last Number Was</span>
                    <div className={styles.bingoLetterCard} style={getLetterStyle(getLastNumber()!)}>
                      {getBingoLetter(getLastNumber()!)}
                    </div>
                    <div className={styles.bingoNumberCard}>
                      {getLastNumber()}
                    </div>
                  </>
                ) : (
                  <span className={styles.lastNumberText}>Waiting For First Number</span>
                )}
              </div>
            </div>
            <div className={styles.specialCalloutSection}>
                <p className={styles.specialCallout}>{getSpecialCallout(getLastNumber())}</p>
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
              const serverUrl = getSetting('serverUrl', '');
              const currentVersion = getSetting('defaultVersion', 'latest');
              const resolvedVersion = resolveVersionAlias(currentVersion);
              const clientRoute = getVersionRoute(resolvedVersion, 'client');

              // Build the QR code URL using the version-specific client route
              const qrCodeValue = `${window.location.origin}/BingoBoard/${resolvedVersion}${clientRoute.path}?roomId=${roomId}&serverUrl=${encodeURIComponent(serverUrl)}`;

              return (
                <div className={styles.qrCodeHeader}>
                  <h4>View On Your Device</h4>
                  <div className={styles.qrCodeSuccess}>
                    <div className={styles.qrCodeContainer}>
                      <QRCode
                        value={qrCodeValue}
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
              {getCalledNumbers().slice().reverse().map((number: number, index: number) => (
                <div
                  key={number}
                  className={`${styles.historyItem} ${index === 0 ? styles.mostRecent : ''}`}
                >
                  {number}
                </div>
              ))}
              {getCalledNumbers().length === 0 && (
                <div className={styles.noNumbers}>No numbers called yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.copyright}>
        <p>© 2025 Eric Gressman. All rights reserved.</p>
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
