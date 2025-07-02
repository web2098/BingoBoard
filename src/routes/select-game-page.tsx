// Select Game Page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './select-game-page.css';
import games from '../data/games';
import HamburgerMenu from '../components/HamburgerMenu';
import QRCode from '../components/QRCode';
import AudienceInteractionButtons from '../components/AudienceInteractionButtons';
import { generateWelcomeMessage } from '../utils/settings';

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

// Game Board Component for displaying 5x5 grids
const GameBoard = ({ board, freeSpace, isSelected = false, onClick }: {
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
      case 'AND': return '&';
      case 'OR': return '|';
      case 'TRANSITION': return '→';
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
        <h4>Rules:</h4>
        <p>{variant.rules}</p>
      </div>
    </div>
  );
};

// Toggle Component for Free Space
const FreeSpaceToggle = ({ freeSpace, onChange }: { freeSpace: boolean, onChange: (value: boolean) => void }) => {
  return (
    <div className="free-space-toggle">
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
        <h4>Join The Game</h4>
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

    onSettingsChange({ ...settings, variant: newVariant });
  };

  const handleGameBoardClick = () => {
    // Toggle free space when clicking on the game board (if available)
    handleFreeSpaceToggle(!settings.freeSpace);
  };

  // Handle scroll wheel for variant rotation
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      handleVariantChange('next');
    } else {
      handleVariantChange('prev');
    }
  };

  const renderGameBoards = () => {
    const boards = settings.freeSpace ? currentVariant.boards : (currentVariant.alt_boards || currentVariant.boards);
    const isDualBoard = boards.length > 1;

    return (
      <div className={`game-boards-container ${isDualBoard ? 'dual-board' : 'single-board'}`}>
        {boards.map((board: number[][], index: number) => (
          <React.Fragment key={index}>
            <GameBoard
              board={board}
              freeSpace={settings.freeSpace}
              onClick={handleGameBoardClick}
            />
            {index < boards.length - 1 && currentVariant.op && (
              <OperatorIcon operator={currentVariant.op} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="game-preview-section" onWheel={handleWheel}>
      <GameInfoCard game={currentGame} variant={currentVariant} />

      <FreeSpaceToggle
        freeSpace={settings.freeSpace}
        onChange={handleFreeSpaceToggle}
      />

      <div className="game-display-area">
        {renderGameBoards()}
      </div>

      <VariantControls
        currentVariant={settings.variant}
        totalVariants={currentGame.variants.length}
        onPrevious={() => handleVariantChange('prev')}
        onNext={() => handleVariantChange('next')}
      />
    </div>
  );
};

// Small Game Preview for Swiper
const SmallGamePreview = ({ game, gameIndex, onClick }: { game: any, gameIndex: number, onClick: () => void }) => {
  const firstVariant = game.variants[0];
  const firstBoard = firstVariant.boards[0];

  return (
    <div className="small-game-preview" onClick={onClick}>
      <div className="small-game-board">
        <GameBoard board={firstBoard} freeSpace={true} />
      </div>
      <div className="game-preview-label">
        {game.name} [{firstVariant.length || 'Standard'}]
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

  const [gameSettings, setGameSettings] = useState<GameSettings>({
    id: 0,
    name: gameList[0].name,
    variant: 0,
    freeSpace: true
  });

  const handleGameSelect = (gameId: number) => {
    setGameSettings({
      id: gameId,
      name: gameList[gameId].name,
      variant: 0, // Reset to first variant when selecting new game
      freeSpace: true
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