import React, { useState, useEffect, useRef } from 'react';
import Lobby from './views/Lobby';
import OfflineGame from './views/OfflineGame';
import OnlineGame from './views/OnlineGame';
import Peer, { DataConnection } from 'peerjs';
import { GameMode, PlayerColor } from './types';

// Prefix to avoid collisions on public peerjs server
const ID_PREFIX = 'zen-gomoku-app-';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.LOBBY);
  const [nickname, setNickname] = useState(localStorage.getItem('nickname') || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  
  // Online State
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const [opponentName, setOpponentName] = useState('');
  const [myColor, setMyColor] = useState<PlayerColor>('black');
  
  // Save nickname
  useEffect(() => {
    localStorage.setItem('nickname', nickname);
  }, [nickname]);

  const initPeer = (id?: string): Peer => {
    // If no ID provided, PeerJS generates one
    const peerId = id ? ID_PREFIX + id : undefined;
    
    // Config with STUN servers optimized for China region
    const peer = new Peer(peerId, {
        config: {
            iceServers: [
                // Domestic (China) STUN servers
                { urls: 'stun:stun.miwifi.com:3478' },
                { urls: 'stun:stun.qq.com:3478' },
                // Global reliable STUN servers as fallback
                { urls: 'stun:stun.syncthing.net:3478' },
                { urls: 'stun:stun.l.google.com:19302' },
            ]
        }
    });
    
    peer.on('error', (err) => {
      console.error("Peer Error:", err);
      // Only reset if we are in connecting state, otherwise it might be a transient error during game
      if (mode === GameMode.LOBBY) {
        setIsConnecting(false);
        setCreatedRoomId(null);
      }
      
      if (err.type === 'peer-unavailable') {
        alert("房间不存在，请检查房间号是否正确。");
      } else if (err.type === 'unavailable-id') {
        alert("ID生成冲突，请重试。");
      } else if (err.type === 'network') {
         alert("网络连接失败，请检查您的网络设置。");
      }
    });

    return peer;
  };

  const createRoom = () => {
    if (peerRef.current) peerRef.current.destroy();
    setIsConnecting(true);
    
    // Generate random 6 digits
    const roomId = Math.floor(100000 + Math.random() * 900000).toString();
    
    const peer = initPeer(roomId);
    peerRef.current = peer;

    peer.on('open', (id) => {
      // We are the host
      setCreatedRoomId(roomId);
      setIsConnecting(false); 
    });

    peer.on('connection', (conn) => {
      // Handle incoming connection
      connRef.current = conn;
      
      // We need to wait for the connection to be fully open before sending data
      conn.on('open', () => {
          setupConnection(conn, 'black'); // Host is black
      });
    });
  };

  const cancelWait = () => {
    if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
    }
    setCreatedRoomId(null);
    setIsConnecting(false);
  };

  const joinRoom = (roomId: string) => {
    if (peerRef.current) peerRef.current.destroy();
    setIsConnecting(true);
    
    // Create a peer without a specific ID (let server assign one) to avoid ID conflicts logic for joiner
    const peer = initPeer();
    peerRef.current = peer;

    peer.on('open', () => {
      const conn = peer.connect(ID_PREFIX + roomId, { reliable: true });
      connRef.current = conn;
      
      conn.on('open', () => {
        setupConnection(conn, 'white'); // Joiner is white
      });
      
      // Error handling specifically for connection is done via peer.on('error') 
      // but we can add a fallback timeout
      setTimeout(() => {
        if (!conn.open && isConnecting) {
             // If still connecting after timeout
             setIsConnecting(false);
             conn.close();
             alert("连接超时，请检查房间号或网络。");
        }
      }, 5000);
    });
  };

  const setupConnection = (conn: DataConnection, color: PlayerColor) => {
    setCreatedRoomId(null); // Clear waiting state
    setMyColor(color);
    setIsConnecting(false); // Stop loading spinner

    // Send Handshake with nickname
    conn.send({ type: 'HANDSHAKE', payload: { nickname } });

    conn.on('data', (data: any) => {
      if (data.type === 'HANDSHAKE') {
        setOpponentName(data.payload.nickname);
        setMode(GameMode.ONLINE);
      }
    });

    conn.on('close', () => {
        alert("对方已断开连接");
        leaveGame();
    });
  };

  const leaveGame = () => {
    if (connRef.current) {
        connRef.current.close();
    }
    if (peerRef.current) {
        peerRef.current.destroy();
    }
    connRef.current = null;
    peerRef.current = null;
    setMode(GameMode.LOBBY);
    setIsConnecting(false);
    setCreatedRoomId(null);
  };

  return (
    <div className="h-full w-full">
      {mode === GameMode.LOBBY && (
        <Lobby 
          nickname={nickname}
          setNickname={setNickname}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onStartOffline={() => setMode(GameMode.OFFLINE)}
          isConnecting={isConnecting}
          createdRoomId={createdRoomId}
          onCancelWait={cancelWait}
        />
      )}

      {mode === GameMode.OFFLINE && (
        <OfflineGame onBack={() => setMode(GameMode.LOBBY)} />
      )}

      {mode === GameMode.ONLINE && connRef.current && (
        <OnlineGame 
          myNickname={nickname}
          opponentNickname={opponentName}
          myColor={myColor}
          connection={connRef.current}
          onLeave={leaveGame}
        />
      )}
    </div>
  );
};

export default App;