export interface Message {
  id: string;
  sender: 'me' | 'peer' | 'system' | 'gemini';
  text: string;
  timestamp: number;
}

export enum CallStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ENDED = 'ENDED',
}

export interface PeerState {
  myId: string;
  remoteId: string;
  callStatus: CallStatus;
  isAudioMuted: boolean;
  isVideoStopped: boolean;
}