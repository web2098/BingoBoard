import React from 'react';
import { getBoardHighlightColor, getContrastTextColor } from '../../utils/settings';
import styles from './GameBoard.module.css';

interface GameBoardProps {
  board: number[][];
  freeSpace: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'mini' | 'large' | 'default';
  isDualBoard?: boolean;
}

// Game Board Component for displaying 5x5 grids with bingo patterns
const GameBoard: React.FC<GameBoardProps> = ({
  board,
  freeSpace,
  isSelected = false,
  onClick,
  className = '',
  size = 'default',
  isDualBoard = false
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

  // Build className with size modifier
  const sizeClass = size !== 'default' ? styles[size] || '' : '';
  const dualBoardClass = isDualBoard && size === 'mini' ? styles.dualBoard || '' : '';
  const boardClassName = `${styles.gameBoard} ${sizeClass} ${dualBoardClass} ${isSelected ? styles.selected : ''} ${className}`.trim();

  return (
    <div
      className={boardClassName}
      onClick={handleClick}
    >
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

export default GameBoard;
