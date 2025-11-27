import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, RotateCcw, Send, MessageCircle, AlertCircle } from 'lucide-react';
import Board from '../components/Board';
import Modal from '../components/Modal';
import { createEmptyBoard, checkWin } from '../utils/gameLogic';
import { BoardState, PlayerColor, Point, WinData, PeerMessage, DanmakuMessage } from '../types';
import Peer, { DataConnection } from 'peerjs';

interface OnlineGameProps {
  myNickname: string;
  opponentNickname: string;
  myColor: PlayerColor;
  connection: DataConnection;
  onLeave: () => void;
}

const OnlineGame: React.FC<OnlineGameProps> = ({ 
  myNickname, 
  opponentNickname, 
  myColor, 
  connection,
  onLeave 
}) => {
  const [board, setBoard] = useState<BoardState>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>('black'); // Black always starts
  const [pendingMove, setPendingMove] = useState<Point | null>(null);
  const [winData, setWinData] = useState<WinData | null>(null);
  const [myWins, setMyWins] = useState(0);
  const [oppWins, setOppWins] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);
  
  // Undo Logic
  const [showUndoRequest, setShowUndoRequest] = useState(false);
  const [waitingForUndoResponse, setWaitingForUndoResponse] = useState(false);

  // Chat
  const [danmakuList, setDanmakuList] = useState<DanmakuMessage[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [showChatInput, setShowChatInput] = useState(false);

  // History for Undo (Simple snapshot of boards)
  const [history, setHistory] = useState<BoardState[]>([]);

  const isMyTurn = currentPlayer === myColor;

  // Initial Snapshot
  useEffect(() => {
    setHistory([createEmptyBoard()]);
  }, []);

  // Delayed Modal
  useEffect(() => {
    if (winData) {
        const timer = setTimeout(() => {
            setShowWinModal(true);
        }, 1500);
        return () => clearTimeout(timer);
    } else {
        setShowWinModal(false);
    }
  }, [winData]);

  // Handle incoming data
  useEffect(() => {
    const handleData = (data: any) => {
      const msg = data as PeerMessage;
      
      switch (msg.type) {
        case 'MOVE':
            // Opponent selected a spot (optional visualization, not implemented for simplicity)
            break;
        case 'CONFIRM_MOVE':
            const { x, y } = msg.payload;
            handleOpponentMove(x, y);
            break;
        case 'UNDO_REQUEST':
            setShowUndoRequest(true);
            break;
        case 'UNDO_ACCEPT':
            performUndo();
            setWaitingForUndoResponse(false);
            break;
        case 'UNDO_REJECT':
            setWaitingForUndoResponse(false);
            alert("对方拒绝了您的悔棋请求");
            break;
        case 'CHAT':
            addDanmaku(msg.payload.text, msg.payload.color);
            break;
        case 'RESTART':
            resetLocalGame();
            break;
      }
    };

    connection.on('data', handleData);
    
    // Cleanup on unmount or connection close logic is handled by parent usually, 
    // but here we just listen.
    return () => {
        connection.off('data', handleData);
    };
  }, [connection, board, currentPlayer, history]); // Deps need to be careful here

  const handleOpponentMove = (x: number, y: number) => {
    setBoard(prev => {
        const newBoard = prev.map(r => [...r]);
        const oppColor = myColor === 'black' ? 'white' : 'black';
        newBoard[y][x] = oppColor;
        
        // Save to history before updating state fully? No, save current state before change
        setHistory(h => [...h, newBoard]);

        const win = checkWin(newBoard, {x, y}, oppColor);
        if (win) {
            setWinData(win);
            setOppWins(w => w + 1);
        } else {
            setCurrentPlayer(myColor); // My turn now
        }
        return newBoard;
    });
  };

  const handleCellClick = (x: number, y: number) => {
    if (winData || !isMyTurn || board[y][x]) return;
    setPendingMove({ x, y });
  };

  const handleConfirmMove = () => {
    if (!pendingMove) return;
    
    const newBoard = board.map(row => [...row]);
    newBoard[pendingMove.y][pendingMove.x] = myColor;
    
    // Update local
    setBoard(newBoard);
    setHistory(h => [...h, newBoard]);
    
    // Check win
    const win = checkWin(newBoard, pendingMove, myColor);
    if (win) {
      setWinData(win);
      setMyWins(w => w + 1);
    } else {
      setCurrentPlayer(myColor === 'black' ? 'white' : 'black');
    }

    // Send to peer
    sendMessage({ type: 'CONFIRM_MOVE', payload: pendingMove });
    setPendingMove(null);
  };

  const requestUndo = () => {
    setWaitingForUndoResponse(true);
    sendMessage({ type: 'UNDO_REQUEST' });
  };

  const respondUndo = (accept: boolean) => {
    setShowUndoRequest(false);
    sendMessage({ type: accept ? 'UNDO_ACCEPT' : 'UNDO_REJECT' });
    if (accept) {
        performUndo();
    }
  };

  const performUndo = () => {
    setHistory(prev => {
        if (prev.length <= 1) return prev;
        const newHistory = [...prev];
        newHistory.pop(); // Remove current state
        const previousBoard = newHistory[newHistory.length - 1];
        
        setBoard(previousBoard);
        setWinData(null); 
        setShowWinModal(false);
        
        // Toggle turn back
        setCurrentPlayer(p => p === 'black' ? 'white' : 'black');
        
        return newHistory;
    });
  };

  const resetLocalGame = () => {
    setBoard(createEmptyBoard());
    setHistory([createEmptyBoard()]);
    setWinData(null);
    setShowWinModal(false);
    setPendingMove(null);
    setCurrentPlayer('black');
  };

  const handleRestart = () => {
    resetLocalGame();
    sendMessage({ type: 'RESTART' });
  };

  const sendMessage = (msg: PeerMessage) => {
    connection.send(msg);
  };

  // Chat Logic
  const addDanmaku = (text: string, color: string) => {
    const id = Date.now().toString() + Math.random();
    const top = Math.floor(Math.random() * 60) + 10; // Random top 10% to 70%
    setDanmakuList(prev => [...prev, { id, text, top, color }]);
    
    // Auto cleanup
    setTimeout(() => {
        setDanmakuList(prev => prev.filter(item => item.id !== id));
    }, 4000);
  };

  const sendChat = () => {
    if (!msgInput.trim()) return;
    const color = myColor === 'black' ? 'text-stone-900' : 'text-stone-100 bg-stone-800 px-2 rounded';
    addDanmaku(msgInput, color); // Show locally
    sendMessage({ type: 'CHAT', payload: { text: msgInput, color } });
    setMsgInput('');
    setShowChatInput(false);
  };

  return (
    <div className="h-full flex flex-col relative bg-stone-100 overflow-hidden">
      
      {/* Danmaku Layer */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {danmakuList.map(item => (
            <div 
                key={item.id}
                className={`absolute whitespace-nowrap text-2xl font-bold animate-danmaku ${item.color}`}
                style={{ top: `${item.top}%`, right: '-100%' }} // Start off screen handled by keyframe
            >
                {item.text}
            </div>
        ))}
      </div>

      {/* Top Bar (Opponent) */}
      <div className="flex justify-between items-center p-4 bg-stone-50 shadow-sm z-30 border-b border-stone-200">
         <button onClick={onLeave} className="p-2 text-stone-500 hover:text-stone-800">
             <ArrowLeft />
         </button>
         
         <div className="flex flex-col items-center">
             <div className="flex items-center gap-2">
                 <div className={`w-4 h-4 rounded-full ${myColor === 'black' ? 'piece-white' : 'piece-black'} shadow-sm`}></div>
                 <span className="font-bold text-stone-600 truncate max-w-[100px]">{opponentNickname}</span>
             </div>
             <div className="text-xs text-stone-400 font-bold">胜局: {oppWins}</div>
         </div>

         <button 
            onClick={requestUndo}
            disabled={waitingForUndoResponse || !!winData || history.length <= 1}
            className="text-stone-500 text-sm font-bold hover:text-wood-600 disabled:opacity-30"
         >
             悔棋
         </button>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center p-2 relative">
         <div className="w-full max-w-[500px] aspect-square">
            <Board 
              board={board} 
              pendingMove={pendingMove} 
              onCellClick={handleCellClick}
              winningPoints={winData?.points || null}
              currentPlayer={currentPlayer}
              disabled={!!winData || !isMyTurn}
            />
         </div>
      </div>

      {/* Bottom Bar (Self) */}
      <div className="bg-white p-4 pb-6 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-30">
         <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${myColor === 'black' ? 'piece-black' : 'piece-white ring-1 ring-stone-300'}`}>
                    <span className={`text-xs font-bold ${myColor === 'black' ? 'text-white' : 'text-stone-800'}`}>我</span>
                 </div>
                 <div>
                     <div className="font-black text-xl text-stone-800">{myNickname}</div>
                     <div className="text-xs font-bold text-stone-400">胜局: {myWins}</div>
                 </div>
             </div>

             {/* Action Button */}
             <div className="flex gap-2">
                 <button 
                    onClick={() => setShowChatInput(!showChatInput)}
                    className="p-3 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200"
                 >
                     <MessageCircle className="w-6 h-6" />
                 </button>

                 {pendingMove && !winData ? (
                     <button 
                        onClick={handleConfirmMove}
                        className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-lg active:scale-95"
                     >
                        <Check className="w-5 h-5" />
                        确认
                     </button>
                 ) : (
                     <div className="w-[140px] flex items-center justify-center text-sm font-bold text-stone-400 italic">
                         {winData 
                            ? '游戏结束' 
                            : isMyTurn ? '轮到你了' : '对方思考中'}
                     </div>
                 )}
             </div>
         </div>

         {/* Chat Input Area (Collapsible) */}
         {showChatInput && (
             <div className="flex gap-2 animate-in slide-in-from-bottom duration-200">
                 <input 
                    className="flex-1 bg-stone-100 rounded-xl px-4 py-2 outline-none border border-stone-200 focus:border-wood-500"
                    placeholder="发送弹幕..."
                    value={msgInput}
                    onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat()}
                 />
                 <button onClick={sendChat} className="bg-wood-600 text-white p-2 rounded-xl">
                     <Send className="w-5 h-5" />
                 </button>
             </div>
         )}
      </div>

      {/* Modals */}
      
      {/* Win/Loss */}
      <Modal isOpen={showWinModal} title={winData?.winner === myColor ? "恭喜获胜!" : "你输了"}
        actions={
            <button onClick={handleRestart} className="bg-wood-600 text-white px-6 py-2 rounded-full font-bold">
                再来一局
            </button>
        }
      >
        <div className="text-center py-4">
            {winData?.winner === myColor ? (
                <p className="text-xl text-green-600 font-bold">胜败乃兵家常事，大侠好身手！</p>
            ) : (
                <p className="text-xl text-stone-500 font-bold">胜败乃兵家常事，再接再厉！</p>
            )}
        </div>
      </Modal>

      {/* Undo Request Received */}
      <Modal isOpen={showUndoRequest} title="对方请求悔棋"
        actions={
            <>
                <button onClick={() => respondUndo(false)} className="px-4 py-2 text-red-500 font-bold">拒绝</button>
                <button onClick={() => respondUndo(true)} className="px-4 py-2 bg-wood-600 text-white rounded-lg font-bold">同意</button>
            </>
        }
      >
        <div className="flex items-center gap-3">
            <AlertCircle className="text-wood-600 w-8 h-8" />
            <p>对方想要撤回上一步棋。</p>
        </div>
      </Modal>

      {/* Waiting for Undo */}
      <Modal isOpen={waitingForUndoResponse} title="等待对方回应...">
         <div className="flex justify-center p-4">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wood-600"></div>
         </div>
      </Modal>

    </div>
  );
};

export default OnlineGame;