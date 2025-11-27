import { BoardState, PlayerColor, Point, WinData } from '../types';

export const BOARD_SIZE = 15;

export const createEmptyBoard = (): BoardState => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
};

export const checkWin = (board: BoardState, lastMove: Point, color: PlayerColor): WinData | null => {
  const directions = [
    { dx: 1, dy: 0 },  // Horizontal
    { dx: 0, dy: 1 },  // Vertical
    { dx: 1, dy: 1 },  // Diagonal \
    { dx: 1, dy: -1 }  // Diagonal /
  ];

  for (const { dx, dy } of directions) {
    let count = 1;
    const winningPoints: Point[] = [{ x: lastMove.x, y: lastMove.y }];

    // Check forward
    let i = 1;
    while (true) {
      const nx = lastMove.x + dx * i;
      const ny = lastMove.y + dy * i;
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE || board[ny][nx] !== color) break;
      winningPoints.push({ x: nx, y: ny });
      count++;
      i++;
    }

    // Check backward
    i = 1;
    while (true) {
      const nx = lastMove.x - dx * i;
      const ny = lastMove.y - dy * i;
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE || board[ny][nx] !== color) break;
      winningPoints.push({ x: nx, y: ny });
      count++;
      i++;
    }

    if (count >= 5) {
      return { winner: color, points: winningPoints };
    }
  }

  return null;
};