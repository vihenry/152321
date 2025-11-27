import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Trophy, RotateCcw } from 'lucide-react';
import Board from '../components/Board';
import Modal from '../components/Modal';
import { createEmptyBoard, checkWin } from '../utils/gameLogic';
import { BoardState, PlayerColor, Point, WinData } from '../types';

interface OfflineGameProps {
  onBack: () => void;
}

const OfflineGame: React.FC<OfflineGameProps> = ({ onBack }) => {
  const [board, setBoard] = useState<BoardState>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>('black');
  const [pendingMove, setPendingMove] = useState<Point | null>(null);
  const [winData, setWinData] = useState<WinData | null>(null);
  const [blackWins, setBlackWins] = useState(0);
  const [whiteWins, setWhiteWins] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);

  // Delayed modal to show animation
  useEffect(() => {
    if (winData) {
        const timer = setTimeout(() => {
            setShowWinModal(true);
        }, 1500); // Wait for 5 pieces * 200ms + buffer
        return () => clearTimeout(timer);
    } else {
        setShowWinModal(false);
    }
  }, [winData]);

  const handleCellClick = (x: number, y: number) => {
    if (winData || board[y][x]) return;
    setPendingMove({ x, y });
  };

  const handleConfirmMove = () => {
    if (!pendingMove) return;
    
    const newBoard = board.map(row => [...row]);
    newBoard[pendingMove.y][pendingMove.x] = currentPlayer;
    setBoard(newBoard);
    
    // Check win
    const win = checkWin(newBoard, pendingMove, currentPlayer);
    if (win) {
      setWinData(win);
      if (currentPlayer === 'black') setBlackWins(p => p + 1);
      else setWhiteWins(p => p + 1);
    } else {
      setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
    }
    
    setPendingMove(null);
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setWinData(null);
    setShowWinModal(false);
    setPendingMove(null);
    setCurrentPlayer('black');
  };

  return (
    <div className="h-full flex flex-col relative bg-stone-100">
      
      {/* Top Player (White) - Rotated 180 degrees for opposite player */}
      <div className="flex-1 flex flex-col justify-end p-4 rotate-180 bg-stone-50 border-b-4 border-stone-200">
        <div className="flex justify-between items-end mb-4">
          <div className="flex flex-col items-start">
            <span className="text-xs font-bold text-stone-400 mb-1">玩家 2</span>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${currentPlayer === 'white' ? 'bg-white shadow-md scale-105' : 'bg-transparent opacity-60'}`}>
              <div className="w-5 h-5 rounded-full piece-white shadow-sm ring-1 ring-gray-300"></div>
              <span className="font-bold text-stone-700">白方</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-stone-400">胜局</span>
            <span className="text-2xl font-black text-stone-700">{whiteWins}</span>
          </div>
        </div>
        
        {/* Top Confirm Action */}
        <div className="h-14 flex justify-center items-center">
             {currentPlayer === 'white' && pendingMove && !winData && (
                <button 
                  onClick={handleConfirmMove}
                  className="flex items-center gap-2 bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
                >
                  <Check className="w-5 h-5" /> 确认落子
                </button>
             )}
        </div>
      </div>

      {/* Board Area */}
      <div className="flex-shrink-0 flex items-center justify-center p-2 md:p-4 my-2">
         <div className="w-full max-w-[500px] aspect-square">
            <Board 
              board={board} 
              pendingMove={pendingMove} 
              onCellClick={handleCellClick}
              winningPoints={winData?.points || null}
              currentPlayer={currentPlayer}
              disabled={!!winData}
            />
         </div>
      </div>

      {/* Bottom Player (Black) - Normal orientation */}
      <div className="flex-1 flex flex-col justify-start p-4 bg-stone-50 border-t-4 border-stone-200">
         <div className="h-14 flex justify-center items-center mb-4">
             {currentPlayer === 'black' && pendingMove && !winData && (
                <button 
                  onClick={handleConfirmMove}
                  className="flex items-center gap-2 bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
                >
                  <Check className="w-5 h-5" /> 确认落子
                </button>
             )}
             {winData && (
                <button onClick={resetGame} className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-lg">
                    <RotateCcw className="w-4 h-4" /> 再来一局
                </button>
             )}
        </div>

        <div className="flex justify-between items-start">
          <div className="flex flex-col items-start">
             <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${currentPlayer === 'black' ? 'bg-white shadow-md scale-105' : 'bg-transparent opacity-60'}`}>
              <div className="w-5 h-5 rounded-full piece-black shadow-sm ring-1 ring-gray-500"></div>
              <span className="font-bold text-stone-700">黑方</span>
            </div>
            <span className="text-xs font-bold text-stone-400 mt-1">玩家 1 (你)</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-2xl font-black text-stone-700">{blackWins}</span>
            <span className="text-xs font-bold text-stone-400">胜局</span>
          </div>
        </div>
        
         <button onClick={onBack} className="absolute bottom-4 left-4 p-2 text-stone-400 hover:text-stone-600">
            <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Winner Modal */}
      <Modal isOpen={showWinModal} title="游戏结束" 
        actions={
            <button onClick={resetGame} className="bg-wood-600 text-white px-6 py-2 rounded-lg font-bold">
                下一局
            </button>
        }
      >
        <div className="flex flex-col items-center gap-4 py-4">
            <Trophy className="w-16 h-16 text-yellow-500 animate-bounce" />
            <h2 className="text-2xl font-bold text-stone-800">
                {winData?.winner === 'black' ? '黑方' : '白方'} 获胜!
            </h2>
        </div>
      </Modal>

    </div>
  );
};

export default OfflineGame;