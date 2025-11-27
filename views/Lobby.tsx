import React, { useState } from 'react';
import { User, Users, Smartphone, Wifi, Copy, X, Share2 } from 'lucide-react';

interface LobbyProps {
  nickname: string;
  setNickname: (name: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onStartOffline: () => void;
  isConnecting: boolean;
  createdRoomId: string | null;
  onCancelWait: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ 
  nickname, 
  setNickname, 
  onCreateRoom, 
  onJoinRoom, 
  onStartOffline,
  isConnecting,
  createdRoomId,
  onCancelWait
}) => {
  const [joinId, setJoinId] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleJoin = () => {
    if (joinId.length !== 6) {
      setError('房间号必须是6位数字');
      return;
    }
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    onJoinRoom(joinId);
  };

  const handleCreate = () => {
     if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    onCreateRoom();
  }

  const copyRoomId = () => {
      if (createdRoomId) {
          navigator.clipboard.writeText(createdRoomId);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
      }
  }

  const handleShare = async () => {
    if (createdRoomId && navigator.share) {
        try {
            await navigator.share({
                title: '禅意五子棋邀请',
                text: `来和我下五子棋！房间号是：${createdRoomId}`,
            });
        } catch (err) {
            console.log('Error sharing:', err);
        }
    } else {
        copyRoomId();
    }
  }

  if (createdRoomId) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 space-y-8">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-8 text-center animate-in zoom-in-95 duration-300">
              <div className="flex justify-center">
                  <div className="w-16 h-16 bg-wood-100 rounded-full flex items-center justify-center text-wood-600 animate-pulse">
                      <Wifi className="w-8 h-8" />
                  </div>
              </div>
              
              <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-stone-800">等待对手加入</h2>
                  <p className="text-stone-500">将房间号分享给好友</p>
              </div>

              <div className="bg-stone-50 border-2 border-stone-200 rounded-2xl p-6 relative group cursor-pointer active:scale-95 transition-transform" onClick={copyRoomId}>
                  <div className="text-4xl font-mono font-black text-stone-800 tracking-[0.2em]">{createdRoomId}</div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                      <span className="flex items-center gap-2 font-bold text-stone-600">
                        {copySuccess ? "已复制!" : <><Copy className="w-5 h-5"/> 复制</>}
                      </span>
                  </div>
              </div>

              <div className="flex flex-col gap-3">
                {typeof navigator.share !== 'undefined' && (
                    <button 
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-wood-600 text-white font-bold hover:bg-wood-700 transition-colors shadow-lg shadow-wood-200"
                    >
                        <Share2 className="w-5 h-5" /> 邀请好友
                    </button>
                )}

                <button 
                    onClick={onCancelWait}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-stone-400 font-bold hover:bg-stone-50 hover:text-red-500 transition-colors"
                >
                    <X className="w-5 h-5" /> 取消等待
                </button>
              </div>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-black text-wood-700 tracking-tighter">禅意五子棋</h1>
        <p className="text-stone-500 font-medium tracking-widest">静心对弈 乐在其中</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6">
        
        {/* Nickname Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-500 uppercase tracking-wider ml-1">昵称</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              placeholder="请输入您的昵称"
              className="w-full bg-stone-50 border-2 border-stone-200 focus:border-wood-500 rounded-xl pl-12 pr-4 py-3 outline-none transition-colors font-bold text-lg text-stone-700"
            />
          </div>
        </div>

        {/* Online Actions */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <button
            onClick={handleCreate}
            disabled={isConnecting}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-wood-100 hover:bg-wood-200 text-wood-800 border-2 border-wood-300 transition-all active:scale-95 disabled:opacity-50"
          >
            <Wifi className="w-8 h-8 mb-2" />
            <span className="font-bold">{isConnecting ? '连接中...' : '创建房间'}</span>
          </button>
          
          <div className="relative group">
            <button
              disabled={isConnecting}
              className="w-full h-full flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-800 border-2 border-blue-200 transition-all active:scale-95 disabled:opacity-50"
              onClick={() => document.getElementById('joinInput')?.focus()}
            >
              <Users className="w-8 h-8 mb-2" />
              <span className="font-bold">加入房间</span>
            </button>
          </div>
        </div>

        {/* Join Input Area */}
        <div className="flex gap-2">
            <input
                id="joinInput"
                type="number"
                value={joinId}
                onChange={(e) => {
                    if (e.target.value.length <= 6) setJoinId(e.target.value);
                    setError('');
                }}
                placeholder="6位房间号"
                className="flex-1 bg-stone-50 border-2 border-stone-200 focus:border-blue-400 rounded-xl px-4 py-3 outline-none text-center font-mono text-lg font-bold tracking-widest placeholder:text-stone-300"
            />
            <button 
                onClick={handleJoin}
                disabled={isConnecting || joinId.length !== 6}
                className="bg-blue-500 text-white rounded-xl px-6 font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
                {isConnecting ? '...' : '加入'}
            </button>
        </div>

        <div className="border-t border-stone-200 pt-6">
          <button
            onClick={onStartOffline}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-stone-800 text-white hover:bg-stone-700 transition-all active:scale-95 shadow-lg shadow-stone-300"
          >
            <Smartphone className="w-6 h-6" />
            <span className="font-bold text-lg">单机双人模式</span>
          </button>
          <p className="text-center text-xs text-stone-400 mt-3">与好友在同一台设备上对战</p>
        </div>

        {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-center text-sm font-bold border border-red-100 animate-pulse">
                {error}
            </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;