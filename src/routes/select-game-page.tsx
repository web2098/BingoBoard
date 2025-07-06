// Select Game Page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './select-game-page.css';
import games from '../data/games';
import HamburgerMenu from '../components/HamburgerMenu';
import QRCode from '../components/QRCode';
import AudienceInteractionButtons from '../components/AudienceInteractionButtons';
import { generateWelcomeMessage, getSetting } from '../utils/settings';

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
    <div className="progress-circle-container">
      <svg width="50" height="50" viewBox="0 0 50 50" className="progress-circle">
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

  return (
    <div className={`game-board ${isSelected ? 'selected' : ''}`} onClick={handleClick}>
      {[0, 1, 2, 3, 4].map((rowIndex) => (
        <div key={rowIndex} className="board-row">
          {[0, 1, 2, 3, 4].map((colIndex) => {
            const isHighlightedCell = isHighlighted(rowIndex, colIndex);
            const isFreeSpace = rowIndex === 2 && colIndex === 2;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`board-cell ${isHighlightedCell ? 'highlighted' : ''} ${isFreeSpace ? 'free-space' : ''}`}
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

// Game Info Card Component
const GameInfoCard = ({ game, variant }: { game: any, variant: any }) => {
  return (
    <div className="game-info-card">
      <h2 className="game-title">{game.name}</h2>
      <div className="game-rules">
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
    <div className="free-space-toggle">
      <span className="toggle-label">Free Space:</span>
      <label className={`toggle-switch ${isDisabled ? 'disabled' : ''}`}>
        <input
          type="checkbox"
          checked={freeSpace}
          onChange={(e) => !isDisabled && onChange(e.target.checked)}
          disabled={isDisabled}
        />
        <span className="slider"></span>
      </label>
      <span className="toggle-state">{freeSpace ? 'ON' : 'OFF'}</span>
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
    <div className="variant-controls">
      <button
        className="variant-arrow"
        onClick={onPrevious}
        disabled={totalVariants <= 1}
      >
        ←
      </button>
      <span className="variant-indicator">
        {currentVariant + 1} / {totalVariants}
      </span>
      <button
        className="variant-arrow"
        onClick={onNext}
        disabled={totalVariants <= 1}
      >
        →
      </button>
    </div>
  );
};

// Welcome Panel Component
const WelcomePanel = () => {
  const welcomeText = generateWelcomeMessage();

  return (
    <div className="welcome-panel">
      <div className="welcome-message-card">
        <h3>Welcome</h3>
        <pre className="welcome-template">{welcomeText}</pre>
      </div>
      <div className="qr-code-card">
        <h4>View On Your Device</h4>
        <div className="qr-code-container">
          <QRCode
            value={`${window.location.origin}/BingoBoard/board`}
            size={200}
            className="game-qr-code"
          />
        </div>
      </div>
    </div>
  );
};

// Main Game Preview Section
const GamePreviewSection = ({
  games,
  settings,
  onSettingsChange
}: {
  games: any[],
  settings: GameSettings,
  onSettingsChange: (settings: GameSettings) => void
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
    // Check if current variant has multiple possible patterns and cache them
    let allPatterns: number[][][][] = [];
    let hasMultiple = false;

    currentVariant.boards.forEach((boardFunction: (freeSpace: boolean) => number[][][]) => {
      if (typeof boardFunction === 'function') {
        const possiblePatterns = boardFunction(settings.freeSpace);
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
    setHasMultiplePatterns(hasMultiple);
    setProgress(0);
    setIsResetting(false);
    setRotationIndex(0);

    if (hasMultiple) {
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

    // Use cached patterns to avoid regenerating them on every render
    if (!cachedPatterns) {
      return <div>Loading patterns...</div>;
    }

    return (
      <div className={`game-boards-container ${isDualBoard ? 'dual-board' : 'single-board'}`}>
        {cachedPatterns.map((possiblePatterns: number[][][], index: number) => {
          // Use rotation index to pick which pattern to display (with wrap-around)
          const selectedPattern = possiblePatterns[rotationIndex % possiblePatterns.length];

          return (
            <React.Fragment key={index}>
              <GameBoard
                board={selectedPattern}
                freeSpace={settings.freeSpace}
                onClick={handleGameBoardClick}
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
    <div className="game-preview-section">
      <GameInfoCard game={currentGame} variant={currentVariant} />

      <FreeSpaceToggle
        freeSpace={settings.freeSpace}
        onChange={handleFreeSpaceToggle}
        variant={currentVariant}
      />

      <div className="game-display-area">
        <div className="game-boards-wrapper">
          {renderGameBoards()}
        </div>
      </div>

      <div className="variant-controls-wrapper">
        <VariantControls
          currentVariant={settings.variant}
          totalVariants={currentGame.variants.length}
          onPrevious={() => handleVariantChange('prev')}
          onNext={() => handleVariantChange('next')}
        />
        {hasMultiplePatterns && (
          <div className="progress-circle-inline">
            <ProgressCircle progress={progress} isResetting={isResetting} />
          </div>
        )}
      </div>
    </div>
  );
};

// Small Game Preview for Swiper
const SmallGamePreview = ({ game, gameIndex, onClick }: { game: any, gameIndex: number, onClick: () => void }) => {
  const firstVariant = game.variants[0];
  const firstBoardFunction = firstVariant.boards[0];

  // Call the board function to get the first pattern using preview mode for consistency
  const firstPattern = typeof firstBoardFunction === 'function'
    ? firstBoardFunction(true, true)[0]  // Get first pattern with free space enabled and preview mode on
    : firstBoardFunction; // Fallback for any remaining non-function boards

  return (
    <div className="small-game-preview" onClick={onClick}>
      <div className="game-preview-label">
        {game.name} [{firstVariant.length || 'Standard'}]
      </div>
      <div className="small-game-board">
        <GameBoard board={firstPattern} freeSpace={true} />
      </div>
    </div>
  );
};

// Game Selection Swiper Section
const GameSelectionSection = ({
  games,
  currentGameId,
  onGameSelect
}: {
  games: any[],
  currentGameId: number,
  onGameSelect: (gameId: number) => void
}) => {
  return (
    <div className="game-selection-section">
      <div className="swiper-container">
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
          className="game-swiper"
        >
          {games.map((game, index) => (
            <SwiperSlide key={index} className="game-slide">
              <SmallGamePreview
                game={game}
                gameIndex={index}
                onClick={() => onGameSelect(index)}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="swiper-navigation">
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
  const gameList = games();
  const navigate = useNavigate();

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
    navigate('/BingoBoard/board');
  };

  return (
    <div className="select-game-page">
      <HamburgerMenu currentPage="select-game" />

      <div className="main-layout">
        <div className="top-section">
          <div className="game-preview-area">
            <GamePreviewSection
              games={gameList}
              settings={gameSettings}
              onSettingsChange={setGameSettings}
            />
          </div>

          <div className="welcome-area">
            <WelcomePanel />
          </div>
        </div>

        <div className="bottom-section">
          <GameSelectionSection
            games={gameList}
            currentGameId={gameSettings.id}
            onGameSelect={handleGameSelect}
          />
        </div>
      </div>

      <button className="start-game-button" onClick={handlePlayGame} title="Start Game">
        <div className="play-icon"></div>
      </button>

      <AudienceInteractionButtons currentPage="select-game" />
    </div>
  );
};

export default SelectGamePage;