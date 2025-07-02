// Home.jsx
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './select-game-page.css';
import games, {boardContainsPoint} from '../data/games';
import HamburgerMenu from '../components/HamburgerMenu';
import QRCode from '../components/QRCode';
import AudienceInteractionButtons from '../components/AudienceInteractionButtons';
import { generateWelcomeMessage } from '../utils/settings';

import { Mousewheel, Keyboard, Pagination, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
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

const SliderViewSize = 4;


//Create a preview game board that is 5x5 with each row containing the letters B, I, N, G, O
const GameBoardPreview = ({isPreview, game}:{isPreview: boolean, game:object}) => {
  const letters = ['B', 'I', 'N', 'G', 'O'];
  const freeSquareRef  = useRef<HTMLDivElement>(null);

  var size = isPreview ? 'small-' : 'large-';


  //console.log("Game: ", game);
  const board = Array.from({ length: 5 }, (_, i) => {
    const row = Array.from({ length: 5 }, (_, j) => {
      var selected = boardContainsPoint(game, i, j);
      var letter = letters[j];
      if (i === 2 && j === 2) {
        return (
          <div key={i* 5 + j} ref={freeSquareRef} className={`${size}preview-square-free ${selected ? 'selected' : ''}`}>
            FREE
          </div>
        );
      }
      return (
        <div key={i* 5 + j} className={`${size}preview-square ${selected ? 'selected' : ''}`}>
          {letter}
        </div>
      );
    });
    return <div key={'row' + i} className={size+"preview-row"}>{row}</div>;
  });
  return <div className={size+"game-board-preview"}>{board}</div>;
}




const WelcomePanel = ({games, settings}: {games: any, settings:GameSettings}) => {
  const game = games[settings.id];
  const variant = game.variants[settings.variant];
  const welcomeText = generateWelcomeMessage();

  return (
    <div className="welcome-panel">
      <div className="welcome-message">
        <pre className="welcome-template">{welcomeText}</pre>
      </div>
      <div className="qr-code-section">
        <h4>See The Board On Your Device</h4>
        <QRCode
          value={`${window.location.origin}/BingoBoard/board`}
          size={300}
          className="game-qr-code"
        />
      </div>
    </div>
  );
};




const Footer = ({games, onBoardSelect}: {games: any, onBoardSelect:any}) => {
  return (
    <div className="footer">
      <div className="game-board-previews">
        <Swiper
          modules={[Navigation, Mousewheel, Keyboard, Pagination]}
          direction={'horizontal'}
          spaceBetween={0}
          slidesPerView={SliderViewSize}
          mousewheel={true}
          keyboard={{
            enabled: true,
          }}
          navigation
          loop={true}
          pagination={{ clickable: true }}
        >
          {Array.from({ length: games.length }, (_, i) => (
          <SwiperSlide key={i} className="preview-slide-entry">
            <div key={i} className="game-preview-entry" onClick={onBoardSelect} data-board={i} >
              <p key={i} className="game-board-preview-label">{games[i].name}</p>
              <GameBoardPreview isPreview={true} game={games[i].variants[0].boards[0]} />
            </div>
          </SwiperSlide>
        ))}
        </Swiper>
      </div>
    </div>
  );
};


const Home = () => {
  const gameList = games();
  const navigate = useNavigate();

  const [
    gameSettings,
    setGameSettings
  ] = React.useState<GameSettings>({
    id: 0,
    name: gameList[0].name,
    variant: 0,
    freeSpace: true
  });

  function handleMainClick(){
    // Toggle free space when clicking the main board
    handleFreeSpaceToggle();
  }

  function handleFreeSpaceToggle(){
    if ( 'alt_boards' in gameList[gameSettings.id].variants[gameSettings.variant]){
      setGameSettings({...gameSettings, freeSpace: !gameSettings.freeSpace});
    }
  }

  function handleRotate(direction: 'left' | 'right'){
    const currentGame = gameList[gameSettings.id];
    const newVariant = direction === 'left' ? (gameSettings.variant - 1 + currentGame.variants.length) % currentGame.variants.length : (gameSettings.variant + 1) % currentGame.variants.length;
    var freeSpace = gameSettings.freeSpace;
    if ( !('alt_boards' in currentGame.variants[newVariant]) ){
      freeSpace = true;
    }
    setGameSettings({...gameSettings, variant: newVariant, freeSpace: freeSpace});
  }

  function onRotateWheel(event: React.WheelEvent<HTMLDivElement>){
    event.preventDefault();
    const delta = Math.sign(event.deltaY);
    handleRotate(delta === 1 ? 'right' : 'left');
  }

  function handlePreviewClick(event: any){
    var freeSpace = gameSettings.freeSpace;
    var game : any = gameList[parseInt(event.currentTarget.dataset.board)];
    if ( !('alt_boards' in game.variants[0]) ){
      freeSpace = true;
    }
    setGameSettings({...gameSettings, freeSpace: freeSpace, id: parseInt(event.currentTarget.dataset.board), variant:0});
  }

  function handlePlayGame(){
    // Store game settings in localStorage for the board page
    localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    navigate('/BingoBoard/board');
  }


  // Game-related variables for the preview section
  const game = gameList[gameSettings.id];
  const variant = game.variants[gameSettings.variant];
  const canToggleFreeSpace = 'alt_boards' in variant;

  var boards = variant.boards;
  if( !gameSettings.freeSpace && (variant as any).alt_boards )
  {
    boards = (variant as any).alt_boards;
  }

  var op = "";
  if( (variant as any).op === "and" ){
    op = "+";
  }
  else if( (variant as any).op === "or"){
    op = "/";
  }
  else if( (variant as any).op === "transition"){
    op = "=>";
  }

  return (
    <div className="home select-game-page">
      <HamburgerMenu currentPage="select-game" />

      <div className="main-content">
        {/* Section 1: Game Preview */}
        <div className="preview-section">
          <div className="game-title-section">
            <div className="game-rules">
              <h4>{game.name}</h4>
              <p>{variant.rules}</p>
            </div>

            <div className="free-space-toggle">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={gameSettings.freeSpace}
                  onChange={handleFreeSpaceToggle}
                  disabled={!canToggleFreeSpace}
                />
                <span className="slider"></span>
              </label>
              <span className="toggle-label">Free Space: {gameSettings.freeSpace ? 'ON' : 'OFF'}</span>
            </div>
          </div>

          <div className="game-preview" onClick={handleMainClick} onWheel={onRotateWheel}>
            {boards.length > 1 ? (
              <div className="multi-board-preview">
                <GameBoardPreview isPreview={false} game={boards[0]}/>
                <p className="board-operator">{op}</p>
                <GameBoardPreview isPreview={false} game={boards[1]}/>
              </div>
            ) : (
              <GameBoardPreview isPreview={false} game={boards[0]}/>
            )}
          </div>

          {game.variants.length > 1 && (
            <div className="variant-controls">
              <button onClick={() => handleRotate('left')} className="variant-arrow">←</button>
              <span>Variant {gameSettings.variant + 1} of {game.variants.length}</span>
              <button onClick={() => handleRotate('right')} className="variant-arrow">→</button>
            </div>
          )}
        </div>

        {/* Section 2: Welcome, Rules, QR Code */}
        <div className="welcome-section">
          <WelcomePanel games={gameList} settings={gameSettings} />
        </div>
      </div>

      {/* Section 3: Game Selection Footer */}
      <div className="game-selection-section">
        <Footer games={gameList} onBoardSelect={handlePreviewClick}/>
      </div>

      {/* Floating Start Game Button */}
      <button className="floating-start-button" onClick={handlePlayGame} title="Start Game">
        <div className="play-icon"></div>
      </button>

      {/* Audience Interaction Buttons */}
      <AudienceInteractionButtons currentPage="select-game" />
    </div>
  );
};

export default Home;