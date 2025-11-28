import React, { useEffect, useRef } from 'react';

interface VideoFeedProps {
  stream: MediaStream | null;
  isMuted?: boolean;
  label: string;
  isLocal?: boolean;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ stream, isMuted = false, label, isLocal = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-700 group">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || isMuted} // Always mute local video to prevent echo
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-slate-500 bg-slate-800">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">Waiting for video...</p>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white pointer-events-none">
        {label} {isMuted && <span className="text-red-400 ml-1">(Muted)</span>}
      </div>
    </div>
  );
};