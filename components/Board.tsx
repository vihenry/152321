import React, { useMemo } from 'react';
import { BoardState, PlayerColor, Point } from '../types';
import { BOARD_SIZE } from '../utils/gameLogic';

interface BoardProps {
  board: BoardState;
  pendingMove: Point | null;
  onCellClick: (x: number, y: number) => void;
  winningPoints: Point[] | null;
  currentPlayer: PlayerColor;
  disabled: boolean;
}

const Board: React.FC<BoardProps> = ({ 
  board, 
  pendingMove, 
  onCellClick, 
  winningPoints, 
  currentPlayer,
  disabled 
}) => {
  
  // Create grid cells
  const cells = useMemo(() => {
    const grid = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        grid.push({ x, y });
      }
    }
    return grid;
  }, []);

  const getWinIndex = (x: number, y: number) => {
    if (!winningPoints) return -1;
    return winningPoints.findIndex(p => p.x === x && p.y === y);
  };

  return (
    <div className="relative p-2 bg-wood-200 rounded-sm shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] select-none border-4 border-wood-300">
      <div 
        className="bg-wood-300 relative grid cursor-pointer"
        style={{
          width: '100%',
          aspectRatio: '1/1',
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
        }}
      >
        {/* Grid Lines Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: BOARD_SIZE }).map((_, i) => (
            <React.Fragment key={i}>
              {/* Horizontal line */}
              <div 
                className="absolute bg-stone-600/60" 
                style={{ 
                  left: `${100 / BOARD_SIZE / 2}%`, 
                  right: `${100 / BOARD_SIZE / 2}%`, 
                  top: `${(i + 0.5) * (100 / BOARD_SIZE)}%`, 
                  height: '1px' 
                }} 
              />
              {/* Vertical line */}
              <div 
                className="absolute bg-stone-600/60" 
                style={{ 
                  top: `${100 / BOARD_SIZE / 2}%`, 
                  bottom: `${100 / BOARD_SIZE / 2}%`, 
                  left: `${(i + 0.5) * (100 / BOARD_SIZE)}%`, 
                  width: '1px' 
                }} 
              />
            </React.Fragment>
          ))}
          {/* Center and Star Points Dots */}
          {[3, 7, 11].map(dy => (
              [3, 7, 11].map(dx => (
                <div 
                    key={`${dx}-${dy}`}
                    className="absolute bg-stone-800 rounded-full"
                    style={{
                    width: '6px',
                    height: '6px',
                    left: `${(dx + 0.5) * (100 / BOARD_SIZE)}%`,
                    top: `${(dy + 0.5) * (100 / BOARD_SIZE)}%`,
                    transform: 'translate(-50%, -50%)'
                    }}
                />
              ))
          ))}
        </div>

        {/* Interaction Layer */}
        {cells.map(({ x, y }) => {
          const piece = board[y][x];
          const isPending = pendingMove?.x === x && pendingMove?.y === y;
          const winIndex = getWinIndex(x, y);
          const isWinner = winIndex !== -1;

          return (
            <div
              key={`${x}-${y}`}
              className="relative z-10 flex items-center justify-center"
              onClick={() => !disabled && onCellClick(x, y)}
            >
              {/* Actual Piece */}
              {piece && (
                <div 
                  className={`
                    w-[85%] h-[85%] rounded-full piece-shadow animate-pop-in
                    ${piece === 'black' ? 'piece-black' : 'piece-white'}
                    ${isWinner ? 'animate-win-light ring-2 ring-green-400' : ''}
                  `}
                  style={{
                    animationDelay: isWinner ? `${winIndex * 200}ms` : '0ms'
                  }}
                />
              )}

              {/* Ghost Piece */}
              {isPending && !piece && (
                <div 
                  className={`
                    w-[80%] h-[80%] rounded-full opacity-60 blur-[1px]
                    ${currentPlayer === 'black' ? 'bg-black' : 'bg-white'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Board;