import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Sparkles } from 'lucide-react';

interface ControlBarProps {
  isAudioMuted: boolean;
  isVideoStopped: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onToggleChat: () => void;
  showChat: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isAudioMuted,
  isVideoStopped,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  onToggleChat,
  showChat,
}) => {
  return (
    <div className="flex items-center gap-4 px-6 py-4 bg-slate-800/80 backdrop-blur-lg rounded-full shadow-2xl border border-slate-700">
      <button
        onClick={onToggleAudio}
        className={`p-4 rounded-full transition-all duration-200 ${
          isAudioMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-700 text-white hover:bg-slate-600'
        }`}
        title={isAudioMuted ? "Unmute" : "Mute"}
      >
        {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
      </button>

      <button
        onClick={onToggleVideo}
        className={`p-4 rounded-full transition-all duration-200 ${
          isVideoStopped ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-700 text-white hover:bg-slate-600'
        }`}
        title={isVideoStopped ? "Start Video" : "Stop Video"}
      >
        {isVideoStopped ? <VideoOff size={24} /> : <Video size={24} />}
      </button>

      <button
        onClick={onEndCall}
        className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-200 shadow-lg shadow-red-500/20 mx-2"
        title="End Call"
      >
        <PhoneOff size={24} />
      </button>

      <div className="w-px h-8 bg-slate-600 mx-2"></div>

      <button
        onClick={onToggleChat}
        className={`p-4 rounded-full transition-all duration-200 ${
          showChat ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-700 text-white hover:bg-slate-600'
        }`}
        title="Toggle Chat & AI"
      >
        <div className="relative">
          <MessageSquare size={24} />
          <div className="absolute -top-1 -right-1">
             <Sparkles size={12} className="text-yellow-400 fill-yellow-400" />
          </div>
        </div>
      </button>
    </div>
  );
};