// Home.jsx
import React, { useRef, useEffect } from 'react';
import '../styles/select-game-page.css';
import games, {boardContainsPoint} from '../data/games';


 //import SwiperCore, { Navigation, Pagination, Scrollbar, A11y } from 'swiper';
 import { Mousewheel, Keyboard, Pagination, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/mousewheel';
import 'swiper/css/keyboard';
// import 'swiper/swiper-bundle.min.css';

//What do I want on this webpage:
// 1. A small header with a button to settings on left, name of the current game, status of free space
//   a. This element should cover 50% of the available space
// 2. Then I want a right panel that will contain 2 paragraph elements that goes 75% of the available vertical space and 40% of the available horizontal space
// 3. The left panel should then contain a preview of the game board
// 4. Below these two panels shoudl be  foot with a small preview of each each available game board
//   a. Only 5 of these should be visible at a time, and you should be able to swipe through or use buttons
// 5. Under this list of game board should be a back, play, and next button


interface GameSettings {
  id: number,
  name: string,
  variant: number,
  freeSpace: boolean,
}


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
          <div key={i* 5 + j} ref={freeSquareRef} className={`${size}preview-square-free preview-square-free ${selected ? 'selected' : ''}`}>
            FREE
          </div>
        );
      }
      return (
        <div key={i* 5 + j} className={`${size}preview-square preview-square ${selected ? 'selected' : ''}`}>
          {letter}
        </div>
      );
    });
    return <div key={'row' + i} className={size+"preview-row preview-row"}>{row}</div>;
  });
  return <div className={size+"game-board-preview game-board-preview"}>{board}</div>;
}




const Header = ({games, settings}: {games: any, settings:GameSettings}) => {
  const freeSpaceMessage = settings.freeSpace ? 'ON' : 'OFF';

  var name = games[settings.id].name;
  if (games[settings.id].variants[settings.variant].name){
    name = games[settings.id].variants[settings.variant].name
  }

  return (
    <div className="header">
      <button className="settings-button">Settings</button>
      <h1 className="game-name">{name}</h1>
      <div className="free-space-status">Free Space: {freeSpaceMessage}</div>
    </div>
  );
};

const RightPanel = ({games, settings}: {games: any, settings:GameSettings}) => {
  const game = games[settings.id];
  //console.log("Current game: ", game.name);
  const hasVariants = game.variants.length > 1;
  const variant = game.variants[settings.variant];

  return (
    <div className="right-panel">
      <p>Paragraph 1</p>
      <p>{variant.rules}</p>
    </div>
  );
};


const LeftPanel = ({games, settings, onBoardClick, onRotate}: {games: any, settings:GameSettings, onBoardClick: any, onRotate:any}) => {
  const game = games[settings.id];
  //console.log("Current game: ", game.name);
  const hasVariants = game.variants.length > 1;
  const variant = game.variants[settings.variant];

  // TODO: Add a foward/back button for variants when required


  var boards = variant.boards;
  if( !settings.freeSpace && variant.alt_boards )
  {
    boards = variant.alt_boards;
  }

  var op = "";
  if( variant.op === "and" ){
    op = "+";
  }
  else if( variant.op === "or"){
    op = "/";
  }
  else if( variant.op === "transition"){
    op = "=>";
  }

  if ( boards.length > 1 )
  {
    return (
      <div className="left-panel" onClick={onBoardClick} onWheel={onRotate}>
          <GameBoardPreview isPreview={false} game={boards[0]}/>
          <p className="left-panel-op">{op}</p>
          <GameBoardPreview isPreview={false} game={boards[1]}/>
      </div>
    );
  }
  return (
    <div className="left-panel" onClick={onBoardClick} onWheel={onRotate}>
        <GameBoardPreview isPreview={false} game={boards[0]}/>
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
          slidesPerView={5}
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
    if ( 'alt_boards' in gameList[gameSettings.id].variants[gameSettings.variant]){
      setGameSettings({...gameSettings, freeSpace: !gameSettings.freeSpace});
    }
  }

  function handleRotate(){
    const currentGame = gameList[gameSettings.id];
    const newVariant = (gameSettings.variant + 1) % currentGame.variants.length;
    var freeSpace = gameSettings.freeSpace;
    if ( !('alt_boards' in currentGame.variants[newVariant]) ){
      freeSpace = true;
    }
    setGameSettings({...gameSettings, variant: newVariant, freeSpace: freeSpace});
  }

  function handlePreviewClick(event: any){
    var freeSpace = gameSettings.freeSpace;
    var game : any = gameList[parseInt(event.currentTarget.dataset.board)];
    if ( !('alt_boards' in game.variants[0]) ){
      freeSpace = true;
    }
    setGameSettings({...gameSettings, freeSpace: freeSpace, id: parseInt(event.currentTarget.dataset.board), variant:0});
  }


  return (
    <div className="home">
      <Header games={gameList} settings={gameSettings}/>
      <p>Welcome to bingo night</p>
      <LeftPanel games={gameList} settings={gameSettings} onBoardClick={handleMainClick} onRotate={handleRotate}/>
      <p>Variant Selected</p>
      <p>Rules</p>
      <div className="footer-buttons">
        <button className='footer-button'>Play</button>
      </div>
      <Footer games={gameList} onBoardSelect={handlePreviewClick}/>
    </div>
  );
};

export default Home;