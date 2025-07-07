import React, { useState, useEffect } from 'react';
import './board-page.css';
import HamburgerMenu from '../components/HamburgerMenu';
import QRCode from '../components/QRCode';
import AudienceInteractionButtons from '../components/AudienceInteractionButtons';

interface BoardPageProps {}

const BoardPage: React.FC<BoardPageProps> = () => {
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [gameData, setGameData] = useState({
    name: "Traditional Bingo",
    freeSpace: true,
    totalNumbers: 75
  });

  // Load game settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setGameData({
        name: settings.name || "Traditional Bingo",
        freeSpace: settings.freeSpace,
        totalNumbers: 75
      });
    }
  }, []);

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
          called: calledNumbers.includes(number)
        });
      }
      grid.push(rowData);
    }
    return grid;
  };

  const bingoGrid = generateBingoGrid();

  const handleNumberClick = (number: number) => {
    if (calledNumbers.includes(number)) {
      // If number is already called, remove it (unselect)
      setCalledNumbers(calledNumbers.filter(num => num !== number));
      // If this was the last number called, clear it
      if (lastNumber === number) {
        setLastNumber(null);
      }
    } else {
      // If number is not called, add it (select)
      setCalledNumbers([...calledNumbers, number]);
      setLastNumber(number);
    }
  };

  const getSpecialCallout = (number: number) => {
    // Add special callouts for certain numbers
    const specialNumbers: { [key: number]: string } = {
      7: "Lucky Seven!",
      13: "Unlucky 13!",
      21: "Legal Age!",
      50: "Half Century!",
      69: "Either Way!",
      75: "Grandpa's Age!"
    };
    return specialNumbers[number] || "";
  };

  return (
    <div className="board-page">
      <HamburgerMenu currentPage="board" />

      {/* Section 1: Header */}
      <div className="board-header">
        <div className="header-left">
          {/* Game Preview */}
          <div className="game-preview-mini">
            <h3>{gameData.name}</h3>
            <div className="mini-board">
              {/* Simple 5x5 preview */}
              <div className="mini-grid">
                {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
                  <div key={letter} className="mini-cell">
                    {letter}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="last-number-section">
            <h2>The last number called is: {lastNumber || "None"}</h2>
            <p className="number-count">
              {calledNumbers.length}/{gameData.totalNumbers} numbers called
            </p>
            {lastNumber && getSpecialCallout(lastNumber) && (
              <p className="special-callout">{getSpecialCallout(lastNumber)}</p>
            )}
          </div>
        </div>

        <div className="header-right">
          {/* QR Code */}
          <div className="qr-code-header">
            <h4>Join Game</h4>
            <QRCode
              value={`${window.location.origin}/BingoBoard/board`}
              size={50}
              className="board-qr-code"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Bingo Numbers Grid */}
      <div className="bingo-grid-section">
        <div className="grid-and-history-container">
          <div className="bingo-grid">
            {bingoGrid.map((row, rowIndex) => (
              <div key={rowIndex} className="bingo-row">
                <div className="row-letter">{row[0].letter}</div>
                {row.map((cell) => (
                  <div
                    key={cell.number}
                    className={`bingo-cell ${cell.called ? 'called' : ''}`}
                    onClick={() => handleNumberClick(cell.number)}
                  >
                    {cell.number}
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          <div className="number-history">
            <h4>Last Numbers Called</h4>
            <div className="history-list">
              {calledNumbers.slice(-10).reverse().map((number, index) => (
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

      <AudienceInteractionButtons currentPage="game-board" />
    </div>
  );
};

export default BoardPage;
