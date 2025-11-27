export type PlayerColor = 'black' | 'white';

export interface Point {
  x: number;
  y: number;
}

export interface WinData {
  winner: PlayerColor;
  points: Point[];
}

export type BoardState = (PlayerColor | null)[][];

export interface Player {
  id: string;
  nickname: string;
  color: PlayerColor;
  wins: number;
}

export enum GameMode {
  LOBBY = 'LOBBY',
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
}

export interface DanmakuMessage {
  id: string;
  text: string;
  top: number; // percentage
  color: string;
}

// PeerJS Message Protocol
export type PeerMsgType = 
  | 'HANDSHAKE' 
  | 'MOVE' 
  | 'CONFIRM_MOVE' 
  | 'UNDO_REQUEST' 
  | 'UNDO_ACCEPT' 
  | 'UNDO_REJECT' 
  | 'CHAT' 
  | 'RESTART';

export interface PeerMessage {
  type: PeerMsgType;
  payload?: any;
}
