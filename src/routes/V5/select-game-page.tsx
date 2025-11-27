// Select Game Page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './select-game-page.module.css';
import games from '../../data/games';
import SidebarWithMenu from '../../components/SidebarWithMenu';
import QRCode from '../../components/QRCode';
import { useServerInteraction } from '../../serverInteractions/useServerInteraction';
import ServerInteractionService from '../../serverInteractions/ServerInteractionService';
import { generateWelcomeMessage, getSetting, getBoardHighlightColor, getContrastTextColor } from '../../utils/settings';
import { getVersionRoute, resolveVersionAlias } from '../../config/versions';
import { switchToNewGame } from '../../utils/telemetry';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Mousewheel, Keyboard } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/mousewheel';
import 'swiper/css/keyboard';

interface GameSettings {
  id: number,
  name: string,
  variant: number,
  freeSpace: boolean,
}

// Progress Circle Component for rotation timing
const ProgressCircle = ({ progress, isResetting }: { progress: number, isResetting: boolean }) => {
  const radius = 20;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div className={styles.progressCircleContainer}>
      <svg width="50" height="50" viewBox="0 0 50 50" className={styles.progressCircle}>
        {/* Background circle */}
        <circle
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          stroke="#007bff"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 25 25)"
          style={{
            transition: isResetting ? 'none' : 'stroke-dashoffset 0.1s linear'
          }}
        />
      </svg>
    </div>
  );
};

// Game Board Component for displaying 5x5 grids
const GameBoard = ({
  board,
  freeSpace,
  isSelected = false,
  onClick,
  colorVersion = 0,
  hasDynamicFreeSpace = false
}: {
  board: number[][],
  freeSpace: boolean,
  isSelected?: boolean,
  onClick?: () => void,
  colorVersion?: number,
  hasDynamicFreeSpace?: boolean
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
            const isFreeSpaceDisabled = isFreeSpace && hasDynamicFreeSpace && !freeSpace;

            // Dynamic styling for highlighted cells
            const cellStyle = isHighlightedCell ? {
              backgroundColor: boardHighlightColor,
              color: highlightTextColor
            } : {};

            return (
              <div
                key={`${rowIndex}-${colIndex}-${colorVersion}`}
                className={`${styles.boardCell} ${isHighlightedCell ? styles.highlighted : ''} ${isFreeSpace ? styles.freeSpace : ''} ${isFreeSpaceDisabled ? styles.disabled : ''}`}
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

// Game Info Card Component
const GameInfoCard = ({
  game,
  variant,
  freeSpace,
  onFreeSpaceChange
}: {
  game: any,
  variant: any,
  freeSpace: boolean,
  onFreeSpaceChange: (value: boolean) => void
}) => {
  return (
    <div className={styles.gameInfoCard}>
      <div className={styles.gameInfoHeader}>
        <h2 className={styles.gameTitle}>{game.name}</h2>
        <FreeSpaceToggle
          freeSpace={freeSpace}
          onChange={onFreeSpaceChange}
          variant={variant}
        />
      </div>
      <div className={styles.gameRules}>
        <h4>{variant.rules}</h4>
      </div>
    </div>
  );
};

// Toggle Component for Free Space
const FreeSpaceToggle = ({
  freeSpace,
  onChange,
  disabled = false,
  variant = null
}: {
  freeSpace: boolean,
  onChange: (value: boolean) => void,
  disabled?: boolean,
  variant?: any
}) => {
  // Toggle should only be disabled if dynamicFreeSpace is not available
  const hasDynamicFreeSpace = variant && variant.hasOwnProperty('dynamicFreeSpace') && variant.dynamicFreeSpace;
  const isDisabled = disabled || (!hasDynamicFreeSpace);

  return (
    <div className={styles.freeSpaceToggle}>
      <span className={styles.toggleLabel}>Free Space:</span>
      <label className={`${styles.toggleSwitch} ${isDisabled ? styles.disabled : ''}`}>
        <input
          type="checkbox"
          checked={freeSpace}
          onChange={(e) => !isDisabled && onChange(e.target.checked)}
          disabled={isDisabled}
        />
        <span className={styles.slider}></span>
      </label>
      <span className={styles.toggleState}>{freeSpace ? 'ON' : 'OFF'}</span>
    </div>
  );
};

// Variant Controls Component
const VariantControls = ({
  currentVariant,
  totalVariants,
  onPrevious,
  onNext
}: {
  currentVariant: number,
  totalVariants: number,
  onPrevious: () => void,
  onNext: () => void
}) => {
  return (
    <div className={styles.variantControls}>
      <button
        className={styles.variantArrow}
        onClick={onPrevious}
        disabled={totalVariants <= 1}
      >
        ←
      </button>
      <span className={styles.variantIndicator}>
        {currentVariant + 1} / {totalVariants}
      </span>
      <button
        className={styles.variantArrow}
        onClick={onNext}
        disabled={totalVariants <= 1}
      >
        →
      </button>
    </div>
  );
};

// Welcome Panel Component
const WelcomePanel = ({ isConnected, roomId, connectionError, developerMode }: {
  isConnected: boolean;
  roomId: string | null;
  connectionError: string | null;
  developerMode: boolean;
}) => {
  const welcomeText = generateWelcomeMessage();
  // Check server settings
  const serverUrl = getSetting('serverUrl', '');
  const authToken = getSetting('serverAuthToken', '');

  const hasServerSettings = serverUrl.trim() !== '' && authToken.trim() !== '';

  // Helper function to generate QR code content
  const generateQRCode = (overrideRoomId?: string) => {
    const currentVersion = getSetting('defaultVersion', 'latest');
    const resolvedVersion = resolveVersionAlias(currentVersion);
    const clientRoute = getVersionRoute(resolvedVersion, 'client');

    // Generate base64 parameters
    const serverUrl = getSetting('serverUrl', '');
    const effectiveRoomId = overrideRoomId || roomId || 'dev-room';
    const base64Params = ServerInteractionService.generateClientParams(effectiveRoomId, serverUrl);

    // Build the QR code URL using the version-specific client route with base64 params
    const qrCodeValue = `${window.location.origin}/BingoBoard/${resolvedVersion}${clientRoute.path}?params=${base64Params}`;
    console.log(`Generated QR Code Value: ${qrCodeValue}`);

    return (
      <div className={styles.qrCodeContainer}>
        <QRCode
          value={qrCodeValue}
          size={200}
          className={styles.gameQrCode}
        />
      </div>
    );
  };

  const renderQRCodeContent = () => {
    if (!hasServerSettings) {
      return (
        <div className={styles.qrCodeMessage}>
          <div className={styles.statusIcon}>⚠️</div>
          <p>Server settings missing</p>
          <p className={styles.statusDetail}>Configure server URL and auth token to enable multiplayer</p>
          <a href="/BingoBoard/settings?expand=bingo-server-settings" className={styles.settingsLink}>Configure Server Settings</a>
        </div>
      );
    }

    if (connectionError) {
      // In developer mode, show QR code even if connection failed
      if (developerMode) {
        return (
          <div className={styles.qrCodeSuccess}>
            {generateQRCode('dev-preview-room')}
          </div>
        );
      }
      return (
        <div className={`${styles.qrCodeMessage} ${styles.error}`}>
          <div className={styles.statusIcon}>❌</div>
          <p>Server connection failed</p>
          <p className={styles.statusDetail}>{connectionError}</p>
          <p className={styles.statusHint}>Check if server is running and settings are correct</p>
        </div>
      );
    }

    if (!isConnected) {
      return (
        <div className={`${styles.qrCodeMessage} ${styles.connecting}`}>
          <div className={styles.statusIcon}>🔄</div>
          <p>Connecting to server...</p>
          <p className={styles.statusDetail}>Attempting to establish connection</p>
        </div>
      );
    }

    if (isConnected && roomId) {
      return (
        <div className={styles.qrCodeSuccess}>
          {generateQRCode()}
        </div>
      );
    }

    // Connected but no room ID yet
    return (
      <div className={`${styles.qrCodeMessage} ${styles.connecting}`}>
        <div className={styles.statusIcon}>🔄</div>
        <p>Setting up room...</p>
        <p className={styles.statusDetail}>Connected to server, creating room</p>
      </div>
    );
  };

  return (
    <div className={styles.welcomePanel}>
      <div className={styles.welcomeMessageCard}>
        <h3>Welcome</h3>
        <pre className={styles.welcomeTemplate}>{welcomeText}</pre>
      </div>
      <div className={styles.qrCodeCard}>
        <h4>User Board View</h4>
        {renderQRCodeContent()}
      </div>
    </div>
  );
};

// Main Game Preview Section
const GamePreviewSection = ({
  games,
  settings,
  onSettingsChange,
  colorVersion = 0
}: {
  games: any[],
  settings: GameSettings,
  onSettingsChange: (settings: GameSettings) => void,
  colorVersion?: number
}) => {
  const currentGame = games[settings.id];
  const currentVariant = currentGame.variants[settings.variant];

  // State for rotation functionality
  const [rotationIndex, setRotationIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [hasMultiplePatterns, setHasMultiplePatterns] = useState(false);
  const [cachedPatterns, setCachedPatterns] = useState<number[][][][] | null>(null);

  // Effect to handle automatic rotation of patterns
  useEffect(() => {
    // Check if rotation is enabled
    const rotationEnabled = getSetting('enablePatternRotation', true);

    // Check if current variant has multiple possible patterns and cache them
    let allPatterns: number[][][][] = [];
    let hasMultiple = false;

    currentVariant.boards.forEach((boardFunction: (freeSpace: boolean, previewMode?: boolean) => number[][][]) => {
      if (typeof boardFunction === 'function') {
        // Use preview mode if rotation is disabled
        const possiblePatterns = boardFunction(settings.freeSpace, !rotationEnabled);
        allPatterns.push(possiblePatterns);
        if (possiblePatterns.length > 1) {
          hasMultiple = true;
        }
      }
    });

    if( currentVariant.filter )
    {
      // run a filter function over the all patterns and remove all boards that have 10 cells
      allPatterns = currentVariant.filter(settings.freeSpace, allPatterns);
    }

    setCachedPatterns(allPatterns);
    setHasMultiplePatterns(hasMultiple && rotationEnabled);
    setProgress(0);
    setIsResetting(false);
    setRotationIndex(0);

    if (hasMultiple && rotationEnabled) {
      // Get rotation interval from settings (in seconds)
      const intervalSeconds = getSetting('patternRotationInterval', 3);
      const intervalMs = intervalSeconds * 1000;

      // Set up interval for rotation
      const rotationInterval = setInterval(() => {
        // Find the maximum number of patterns across all boards
        const maxPatterns = Math.max(...allPatterns.map(patterns => patterns.length));

        setRotationIndex(prevIndex => (prevIndex + 1) % maxPatterns);
        setProgress(0);
        setIsResetting(true);

        // Re-enable transitions after a brief moment
        setTimeout(() => {
          setIsResetting(false);
        }, 50);
      }, intervalMs);

      // Set up progress interval (update every 100ms for smooth animation)
      const progressUpdateInterval = 100;
      const progressInterval = setInterval(() => {
        setProgress(prevProgress => {
          const increment = progressUpdateInterval / intervalMs;
          const newProgress = prevProgress + increment;
          return newProgress >= 1 ? 1 : newProgress;
        });
      }, progressUpdateInterval);

      return () => {
        clearInterval(rotationInterval);
        clearInterval(progressInterval);
      };
    }
  }, [currentVariant, settings.freeSpace]);

  const handleFreeSpaceToggle = (freeSpace: boolean) => {
    onSettingsChange({ ...settings, freeSpace });
  };

  const handleVariantChange = (direction: 'prev' | 'next') => {
    const totalVariants = currentGame.variants.length;
    let newVariant = settings.variant;

    if (direction === 'prev') {
      newVariant = settings.variant > 0 ? settings.variant - 1 : totalVariants - 1;
    } else {
      newVariant = settings.variant < totalVariants - 1 ? settings.variant + 1 : 0;
    }

    // Helper function to determine default freeSpace value for a variant
    const getDefaultFreeSpace = (game: any, variantIndex: number): boolean => {
      const variant = game.variants[variantIndex];

      // If variant explicitly defines freeSpace, use that value
      if (variant.hasOwnProperty('freeSpace')) {
        return variant.freeSpace;
      }

      // Otherwise, default to false unless dynamicFreeSpace exists, then default to true
      const hasDynamicFreeSpace = variant.hasOwnProperty('dynamicFreeSpace') && variant.dynamicFreeSpace;
      return hasDynamicFreeSpace;
    };

    // Update both variant and freeSpace based on the new variant's default
    onSettingsChange({
      ...settings,
      variant: newVariant,
      freeSpace: getDefaultFreeSpace(currentGame, newVariant)
    });
  };

  const handleGameBoardClick = () => {
    // Only toggle free space if dynamicFreeSpace is available for this variant
    const hasDynamicFreeSpace = currentVariant && currentVariant.hasOwnProperty('dynamicFreeSpace') && currentVariant.dynamicFreeSpace;
    if (hasDynamicFreeSpace) {
      handleFreeSpaceToggle(!settings.freeSpace);
    }
  };

  const renderGameBoards = () => {
    // All boards are now functions that return arrays of possible patterns
    const isDualBoard = currentVariant.boards.length > 1;
    const isDoubleBingo = currentGame.name === "Double Bingo";

    // Use cached patterns to avoid regenerating them on every render
    if (!cachedPatterns) {
      return <div>Loading patterns...</div>;
    }

    return (
      <div className={`${styles.gameBoardsContainer} ${isDualBoard ? styles.dualBoard : styles.singleBoard} ${isDoubleBingo && isDualBoard ? styles.doubleBingoDual : ''}`}>
        {cachedPatterns.map((possiblePatterns: number[][][], index: number) => {
          // Use rotation index to pick which pattern to display (with wrap-around)
          const selectedPattern = possiblePatterns[rotationIndex % possiblePatterns.length];

          return (
            <React.Fragment key={index}>
              <GameBoard
                board={selectedPattern}
                freeSpace={settings.freeSpace}
                onClick={handleGameBoardClick}
                colorVersion={colorVersion}
                hasDynamicFreeSpace={currentVariant.hasOwnProperty('dynamicFreeSpace') && currentVariant.dynamicFreeSpace}
              />
              {index < cachedPatterns.length - 1 && currentVariant.op && (
                <OperatorIcon operator={currentVariant.op} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.gamePreviewSection}>
      <GameInfoCard
        game={currentGame}
        variant={currentVariant}
        freeSpace={settings.freeSpace}
        onFreeSpaceChange={handleFreeSpaceToggle}
      />

      <div className={styles.variantControlsWrapper}>
        <VariantControls
          currentVariant={settings.variant}
          totalVariants={currentGame.variants.length}
          onPrevious={() => handleVariantChange('prev')}
          onNext={() => handleVariantChange('next')}
        />
        {hasMultiplePatterns && (
          <div className={styles.progressCircleInline}>
            <ProgressCircle progress={progress} isResetting={isResetting} />
          </div>
        )}
      </div>

      <div className={styles.gameDisplayArea}>
        <div className={styles.gameBoardsWrapper}>
          {renderGameBoards()}
        </div>
      </div>
    </div>
  );
};

// Small Game Preview for Swiper
const SmallGamePreview = ({
  game,
  gameIndex,
  onClick,
  colorVersion = 0
}: {
  game: any,
  gameIndex: number,
  onClick: () => void,
  colorVersion?: number
}) => {
  const firstVariant = game.variants[0];
  const firstBoardFunction = firstVariant.boards[0];
  const isDualBoard = firstVariant.boards.length > 1;
  const isDoubleBingo = game.name === "Double Bingo";

  // Call the board function to get the first pattern using preview mode for consistency
  const firstPattern = typeof firstBoardFunction === 'function'
    ? firstBoardFunction(true, true)[0]  // Get first pattern with free space enabled and preview mode on
    : firstBoardFunction; // Fallback for any remaining non-function boards

  return (
    <div className={styles.smallGamePreview} onClick={onClick}>
      <div className={styles.gamePreviewLabel}>
        {game.name} [{firstVariant.length || 'Standard'}]
      </div>
      <div className={`${styles.smallGameBoard} ${isDualBoard && isDoubleBingo ? styles.doubleBingoDual : ''}`}>
        <GameBoard
          board={firstPattern}
          freeSpace={true}
          colorVersion={colorVersion}
          hasDynamicFreeSpace={false}
        />
      </div>
    </div>
  );
};

// Game Selection Swiper Section
const GameSelectionSection = ({
  games,
  currentGameId,
  onGameSelect,
  colorVersion = 0
}: {
  games: any[],
  currentGameId: number,
  onGameSelect: (gameId: number) => void,
  colorVersion?: number
}) => {
  return (
    <div className={styles.gameSelectionSection}>
      <div className={styles.swiperContainer}>
        <Swiper
          modules={[Navigation, Pagination, Mousewheel, Keyboard]}
          spaceBetween={20}
          slidesPerView={4}
          slidesPerGroup={1}
          loop={true}
          loopAdditionalSlides={4}
          breakpoints={{
            320: {
              slidesPerView: 2,
              slidesPerGroup: 1,
            },
            640: {
              slidesPerView: 3,
              slidesPerGroup: 1,
            },
            768: {
              slidesPerView: 4,
              slidesPerGroup: 1,
            },
          }}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          }}
          pagination={{
            clickable: true,
            el: '.swiper-pagination',
          }}
          mousewheel={true}
          keyboard={true}
          className={styles.gameSwiper}
        >
          {games.map((game, index) => (
            <SwiperSlide key={index} className={styles.gameSlide}>
              <SmallGamePreview
                game={game}
                gameIndex={index}
                onClick={() => onGameSelect(index)}
                colorVersion={colorVersion}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className={styles.swiperNavigation}>
          <div className="swiper-button-prev"></div>
          <div className="swiper-pagination"></div>
          <div className="swiper-button-next"></div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const SelectGamePage = () => {
  const navigate = useNavigate();
  const [gameList, setGameList] = useState(games());
  const [settingsUpdateTrigger, setSettingsUpdateTrigger] = useState(0);
  const [highlightColorVersion, setHighlightColorVersion] = useState(0);
  const [developerMode] = useState(() => getSetting('developerMode', false));

  // Server interaction for audience interactions and connection
  const { isConnected, roomId, connectionError, sendAudienceInteraction } = useServerInteraction({
    autoConnect: true, // Enable auto-connection for host pages
    autoConnectRetryInterval: getSetting('connectionTimeout', 10)
  });


  // Update game list when settings change
  useEffect(() => {
    setGameList(games());
  }, [settingsUpdateTrigger]);

  // Listen for storage changes to detect settings updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bingoSettings' && e.newValue !== e.oldValue) {
        setSettingsUpdateTrigger(prev => prev + 1);
        setHighlightColorVersion(prev => prev + 1);
      }
    };

    // Listen for custom settings change events
    const handleSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setSettingsUpdateTrigger(prev => prev + 1);

      // Update highlight color version if board highlight color changed
      if (customEvent.detail && customEvent.detail.id === 'boardHighlightColor') {
        setHighlightColorVersion(prev => prev + 1);
      }

      // Trigger pattern regeneration for rotation setting changes
      if (customEvent.detail && (customEvent.detail.id === 'enablePatternRotation' || customEvent.detail.id === 'patternRotationInterval')) {
        setSettingsUpdateTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bingoSettingsChanged', handleSettingsChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bingoSettingsChanged', handleSettingsChange);
    };
  }, []);

  // Helper function to determine default freeSpace value for a variant
  const getDefaultFreeSpace = (game: any, variantIndex: number): boolean => {
    const variant = game.variants[variantIndex];

    // If variant explicitly defines freeSpace, use that value
    if (variant.hasOwnProperty('freeSpace')) {
      return variant.freeSpace;
    }

    // Otherwise, default to false unless dynamicFreeSpace exists, then default to true
    const hasDynamicFreeSpace = variant.hasOwnProperty('dynamicFreeSpace') && variant.dynamicFreeSpace;
    return hasDynamicFreeSpace;
  };

  const [gameSettings, setGameSettings] = useState<GameSettings>({
    id: 0,
    name: gameList[0].name,
    variant: 0,
    freeSpace: getDefaultFreeSpace(gameList[0], 0)
  });

  const handleGameSelect = (gameId: number) => {
    const newGame = gameList[gameId];
    const newVariant = 0; // Reset to first variant when selecting new game

    setGameSettings({
      id: gameId,
      name: newGame.name,
      variant: newVariant,
      freeSpace: getDefaultFreeSpace(newGame, newVariant)
    });
  };

  const handlePlayGame = () => {
    // Store game settings in localStorage for the board page
    localStorage.setItem('gameSettings', JSON.stringify(gameSettings));

    // Initialize telemetry session for the new game
    switchToNewGame(
      gameSettings.id,
      gameSettings.name,
      gameSettings.variant,
      gameSettings.freeSpace,
      75 // total numbers
    );

    // Navigate to board using version-aware routing
    const currentVersion = getSetting('defaultVersion', 'latest');
    const resolvedVersion = resolveVersionAlias(currentVersion);
    const boardRoute = getVersionRoute(resolvedVersion, 'board');

    if (boardRoute.external) {
      // For external routes, use window.location.href
      window.location.href = boardRoute.path;
    } else {
      // For internal routes, use React Router navigation
      navigate(boardRoute.path);
    }
  };

  return (
    <div className={styles.selectGamePage}>
      <SidebarWithMenu
        currentPage="select-game"
        pageButtons={[
          {
            id: 'start-game',
            label: 'Start Game',
            icon: <div className={styles.playIcon}></div>,
            onClick: handlePlayGame,
            className: styles.startGameButton
          }
        ]}
        onAudienceInteraction={sendAudienceInteraction}
      />

      <div className={styles.mainLayout}>
        <div className={styles.topSection}>
          <div className={styles.gamePreviewArea}>
            <GamePreviewSection
              games={gameList}
              settings={gameSettings}
              onSettingsChange={setGameSettings}
              colorVersion={highlightColorVersion}
            />
          </div>

          <div className={styles.welcomeArea}>
            <WelcomePanel
              isConnected={isConnected}
              roomId={roomId}
              connectionError={connectionError}
              developerMode={developerMode}
            />
          </div>
        </div>

        <div className={styles.bottomSection}>
          <GameSelectionSection
            games={gameList}
            currentGameId={gameSettings.id}
            onGameSelect={handleGameSelect}
            colorVersion={highlightColorVersion}
          />
        </div>
      </div>
    </div>
  );
};

export default SelectGamePage;