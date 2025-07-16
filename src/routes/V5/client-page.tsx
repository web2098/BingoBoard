import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './client-page.module.css';
import QRCode from '../../components/QRCode';
import ClientSettings from '../../components/ClientSettings';
import ClientLog from '../../components/ClientLog';
import { BoardPreviewModal, GameBoard, OperatorIcon } from '../../components/boards';
import { useServerInteraction } from '../../serverInteractions/useServerInteraction';
import ServerInteractionService from '../../serverInteractions/ServerInteractionService';
import { getNumberMessage, getLetterColor, getContrastTextColor, getBoardHighlightColor, getSetting } from '../../utils/settings';
import { getVersionRoute, resolveVersionAlias } from '../../config/versions';
import games from '../../data/games';
import { AudienceInteractionModalManager } from '../../components/modals';
import audienceInteractionsData from '../../data/audienceInteractions.json';
import { useConsoleLog } from '../../hooks/useConsoleLog';

interface ClientPageProps {}

/**
 * Audience Interaction System:
 *
 * The board page sends audience interactions with options that include:
 * - enable_audio: whether audio should be played
 * - enable_images: whether images/graphics should be shown
 * - section: the name/type of the interaction being shown
 *
 * Client settings can override these options:
 * - clientEnablePopups: master toggle for all popups
 * - clientPopupEnableAudio: override for audio (AND with server setting)
 * - clientPopupGraphicToTheDeath: override for images (AND with server setting)
 */

// Interface for audience interaction options
interface AudienceInteractionOptions {
  enable_audio?: boolean;
  enable_image?: boolean;
}

const ClientPage: React.FC<ClientPageProps> = () => {
  const [searchParams] = useSearchParams();

  // Parse parameters from URL - support both old format and new base64 format
  let roomId: string | null = null;
  let serverUrl: string | null = null;

  const base64Params = searchParams.get('params');
  if (base64Params) {
    // New format: base64-encoded JSON
    const parsed = ServerInteractionService.parseClientParams(base64Params);
    if (parsed) {
      roomId = parsed.roomId;
      serverUrl = parsed.serverUrl;
    }
  } else {
    // Fallback to old format for backward compatibility
    roomId = searchParams.get('roomId');
    serverUrl = searchParams.get('serverUrl');
  }

  // Initialize console logging - this will capture all console outputs and display in the log section
  const { logs, clearLogs } = useConsoleLog({ maxEntries: 200 });

  // Log component initialization
  useEffect(() => {
    console.log('Client page initialized with logging system');
    console.info('Console logging is now active and will display in the log section below');
    console.warn('This is a sample warning message');

    // Log connection parameters
    if (roomId && serverUrl) {
      console.log('Connection parameters:', { roomId, serverUrl });
    } else {
      console.error('Missing connection parameters:', { roomId, serverUrl });
    }
  }, [roomId, serverUrl]);

  // Helper function to get client setting value
  const getClientSetting = (settingId: string, defaultValue: any = null) => {
    const savedValue = localStorage.getItem(settingId);
    if (savedValue !== null) {
      try {
        return JSON.parse(savedValue);
      } catch {
        return savedValue;
      }
    }
    return defaultValue;
  };

  const {
    isConnected,
    connectionError,
    lastSetupMessage,
    lastActivateMessage,
    lastDeactivateMessage,
    lastFreeSpaceMessage,
    joinRoom  } = useServerInteraction({    onAudienceInteraction: (eventType: string, options: AudienceInteractionOptions) => {
      // Check if popups are enabled in client settings
      const popupsEnabled = getClientSetting('clientEnablePopups', true);

      if (!popupsEnabled) {
        console.log('Audience interaction blocked by client settings:', eventType);
        return;
      }

      // Look up the interaction data from audienceInteractions.json
      const interaction = audienceInteractionsData.find(item => item.id === eventType);
      if (interaction) {
        // Create enhanced options with client setting overrides
        const enhancedOptions = {
          // Start with server options
          ...options,
          // Apply client setting overrides (AND with server settings)
          enable_audio: getClientSetting('clientPopupEnableAudio', true) && (options?.enable_audio ?? true),
          enable_image: getClientSetting('clientPopupGraphicToTheDeath', true) && (options?.enable_image ?? true)
        };

        console.log('Audience interaction with options:', eventType, enhancedOptions);

        // Check if the global function exists
        if ((window as any).showAudienceInteraction) {
          (window as any).showAudienceInteraction(interaction, enhancedOptions);
        }
      } else {
        console.warn('Unknown audience interaction type:', eventType);
      }
    },
    onModalDeactivate: () => {
      console.log('Client received modal deactivate');
      // Hide any currently shown modal
      if ((window as any).hideAudienceInteraction) {
        (window as any).hideAudienceInteraction();
      }
    }
  });

  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [gameData, setGameData] = useState<{
    id: number;
    name: string;
    variant: number;
    freeSpace: boolean;
    totalNumbers: number;
  } | null>(null);

  // State for pattern display and rotation
  const [cachedPatterns, setCachedPatterns] = useState<number[][][][] | null>(null);
  const [rotationIndex, setRotationIndex] = useState(0);
  const [rotationEnabled, setRotationEnabled] = useState(true);

  // Modal state for board preview
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Ref to store the rotation interval so we can clear it
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to store the wake lock
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

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

  // Wake lock functionality to prevent screen from turning off
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && navigator.wakeLock) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Screen Wake Lock is active');

        wakeLockRef.current.addEventListener('release', () => {
          console.log('Screen Wake Lock released');
        });
      } else {
        console.warn('Wake Lock API not supported');
      }
    } catch (err: any) {
      console.error('Wake Lock not supported', err.name, err.message);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Wake Lock manually released');
    }
  };

  // Request wake lock when component mounts and page becomes visible
  useEffect(() => {
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, []);

  // Connect to server when component mounts
  useEffect(() => {
    if (roomId && serverUrl && !connectionInitiated.current) {
      console.log('Connecting to room:', roomId, 'on server:', serverUrl);
      connectionInitiated.current = true;
      joinRoom(serverUrl, roomId);
    } else if (!roomId || !serverUrl) {
      console.error('Cannot connect: missing roomId or serverUrl');
    }
  }, [roomId, serverUrl, joinRoom]);

  // Log connection status changes
  useEffect(() => {
    if (isConnected) {
      console.info('Successfully connected to server');
    } else {
      console.warn('Not connected to server');
    }
  }, [isConnected]);

  // Log connection errors
  useEffect(() => {
    if (connectionError) {
      console.error('Connection error:', connectionError);
    }
  }, [connectionError]);

  // Handle setup message from server
  useEffect(() => {
    if (lastSetupMessage && lastSetupMessage.type === 'setup') {
      console.log('Client processing setup message:', lastSetupMessage);
      const newGameData = {
        id: 0, // We don't have game ID from server, use default
        name: lastSetupMessage.data.game,
        variant: 0, // We don't have variant from server, use default
        freeSpace: lastSetupMessage.data.free,
        totalNumbers: 75
      };
      setGameData(newGameData);
      // Use the setup message's called numbers and last number directly
      setCalledNumbers(lastSetupMessage.data.active || []);
      setLastNumber(lastSetupMessage.data.lastNumber || null);
    }
  }, [lastSetupMessage]);

  // Handle number activation messages
  useEffect(() => {
    if (lastActivateMessage && lastActivateMessage.type === 'activate') {
      console.log('Client processing activate message:', lastActivateMessage);
      setCalledNumbers(prev => {
        if (!prev.includes(lastActivateMessage.id)) {
          setLastNumber(lastActivateMessage.id);
          return [...prev, lastActivateMessage.id];
        }
        return prev;
      });
    }
  }, [lastActivateMessage]);

  // Handle number deactivation messages
  useEffect(() => {
    if (lastDeactivateMessage && lastDeactivateMessage.type === 'deactivate') {
      console.log('Client processing deactivate message:', lastDeactivateMessage);
      const deactivatedNumber = lastDeactivateMessage.id;

      setCalledNumbers(prev => {
        const newNumbers = prev.filter(n => n !== deactivatedNumber);

        // Update last number if the deactivated number was the last number
        setLastNumber(currentLastNumber => {
          if (deactivatedNumber === currentLastNumber) {
            return newNumbers.length > 0 ? newNumbers[newNumbers.length - 1] : null;
          }
          return currentLastNumber;
        });

        return newNumbers;
      });
    }
  }, [lastDeactivateMessage]);

  // Handle free space updates
  useEffect(() => {
    if (lastFreeSpaceMessage && lastFreeSpaceMessage.type === 'update_free') {
      console.log('Client processing free space message:', lastFreeSpaceMessage);
      setGameData(prev => prev ? { ...prev, freeSpace: lastFreeSpaceMessage.free } : null);
    }
  }, [lastFreeSpaceMessage]);

  // Check rotation setting and update state when it changes
  useEffect(() => {
    const currentRotationEnabled = getClientSetting('clientEnablePatternRotation', true);
    setRotationEnabled(currentRotationEnabled);

    // Listen for client setting changes
    const handleSettingChange = (event: CustomEvent) => {
      if (event.detail.settingId === 'clientEnablePatternRotation') {
        setRotationEnabled(event.detail.value);
      }
    };

    window.addEventListener('clientSettingChanged', handleSettingChange as EventListener);

    return () => {
      window.removeEventListener('clientSettingChanged', handleSettingChange as EventListener);
    };
  }, []);

  // Generate patterns for display when game data or rotation setting changes
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
      let hasMultiple = false;

      // Generate patterns for each board - use preview mode if rotation is disabled
      currentVariant.boards.forEach((boardFunction: any) => {
        if (typeof boardFunction === 'function') {
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
      setRotationIndex(0);

      // Clear any existing rotation interval
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }

      // Set up rotation interval if there are multiple patterns and rotation is enabled
      if (hasMultiple && rotationEnabled) {
        const intervalSeconds = getSetting('patternRotationInterval', 3);
        const intervalMs = intervalSeconds * 1000;

        rotationIntervalRef.current = setInterval(() => {
          const maxPatterns = Math.max(...allPatterns.map(patterns => patterns.length));
          setRotationIndex(prevIndex => (prevIndex + 1) % maxPatterns);
        }, intervalMs);
      }
    } catch (error) {
      console.error('Error setting up patterns for client:', error);
      setCachedPatterns(null);
    }

    // Cleanup function to clear interval when effect reruns or component unmounts
    return () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
    };
  }, [gameData, rotationEnabled]);

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

  // Modal handlers
  const handlePreviewClick = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  // Render the board preview
  const renderBoardPreview = () => {
    if (!gameData) return null;

    try {
      const gamesList = games();
      const currentGame = gamesList.find(game => game.name === gameData.name) || gamesList[0];

      if (!currentGame || !currentGame.variants || !currentGame.variants[gameData.variant]) {
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
      let filteredPatterns: number[][][];

      if (cachedPatterns) {
        // Use cached patterns - rotation logic is handled in the pattern generation
        filteredPatterns = cachedPatterns.map((possiblePatterns: number[][][]) => {
          if (rotationEnabled && possiblePatterns.length > 1) {
            const selectedPattern = possiblePatterns[rotationIndex % possiblePatterns.length];
            return selectedPattern;
          } else {
            return possiblePatterns[0] || [];
          }
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
        <div
          className={`${styles.gameBoardsContainer} ${isDualBoard ? styles.dualBoard : styles.singleBoard} ${styles.clickablePreview}`}
          onClick={handlePreviewClick}
        >
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

  // Show loading or error states
  if (!roomId || !serverUrl) {
    return (
      <AudienceInteractionModalManager>
        <div className={styles.clientPage}>
          <div className={styles.errorMessage}>
            <h2>Missing Connection Information</h2>
            <p>Room ID and Server URL are required to connect.</p>
          </div>

          {/* Client Log Section */}
          <ClientLog logs={logs} onClearLogs={clearLogs} />
        </div>

        <div className={styles.copyright}>
          <p>© 2025 Eric Gressman. All rights reserved.</p>
        </div>
      </AudienceInteractionModalManager>
    );
  }

  if (connectionError) {
    return (
      <AudienceInteractionModalManager>
        <div className={styles.clientPage}>
          <div className={styles.errorMessage}>
            <h2>Connection Error</h2>
            <p>{connectionError}</p>
            <p>Please check your connection and try again.</p>
          </div>

          {/* Client Log Section */}
          <ClientLog logs={logs} onClearLogs={clearLogs} />
        </div>

        <div className={styles.copyright}>
          <p>© 2025 Eric Gressman. All rights reserved.</p>
        </div>
      </AudienceInteractionModalManager>
    );
  }

  if (!isConnected) {
    return (
      <AudienceInteractionModalManager>
        <div className={styles.clientPage}>
          <div className={styles.loadingMessage}>
            <h2>Connecting...</h2>
            <p>Connecting to room {roomId}</p>
          </div>

          {/* Client Log Section */}
          <ClientLog logs={logs} onClearLogs={clearLogs} />
        </div>

        <div className={styles.copyright}>
          <p>© 2025 Eric Gressman. All rights reserved.</p>
        </div>
      </AudienceInteractionModalManager>
    );
  }

  if (!gameData) {
    return (
      <AudienceInteractionModalManager>
        <div className={styles.clientPage}>
          <div className={styles.loadingMessage}>
            <h2>Waiting for Game Data...</h2>
            <p>Connected to room. Waiting for game setup.</p>
          </div>

          {/* Client Log Section */}
          <ClientLog logs={logs} onClearLogs={clearLogs} />
        </div>

        <div className={styles.copyright}>
          <p>© 2025 Eric Gressman. All rights reserved.</p>
        </div>
      </AudienceInteractionModalManager>
    );
  }

  return (
    <AudienceInteractionModalManager>
      <div className={styles.clientPage}>
        {/* Header */}
        <div className={styles.boardHeader}>
          <div className={styles.headerLeft}>
            {/* Game Preview */}
            <div className={styles.gamePreviewMini}>
              <div className={styles.gamePreviewHeader}>
                <h3>{gameData.name}</h3>
                <p className={styles.freeSpaceStatus}>
                  Free Space: {gameData.freeSpace ? 'ON' : 'OFF'}
                </p>
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
                    value={window.location.href}
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

        {/* Client Settings Section */}
        <ClientSettings />

        {/* Client Log Section */}
        <ClientLog logs={logs} onClearLogs={clearLogs} />

        {/* Board Preview Modal */}
        {gameData && (
          <BoardPreviewModal
            isVisible={isModalVisible}
            onClose={handleModalClose}
            gameData={gameData}
            rotationIndex={rotationIndex}
            cachedPatterns={cachedPatterns}
            showFreeSpaceToggle={false}
            showRules={true}
          />
        )}
      </div>

      <div className={styles.copyright}>
        <p>© 2025 Eric Gressman. All rights reserved.</p>
      </div>
    </AudienceInteractionModalManager>
  );
};

export default ClientPage;
