import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import { VideoFeed } from './components/VideoFeed';
import { ControlBar } from './components/ControlBar';
import { ChatPanel } from './components/ChatPanel';
import { PeerState, CallStatus, Message } from './types';
import { Copy, Check, Info, Phone, Link as LinkIcon } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [peerState, setPeerState] = useState<PeerState>({
    myId: '',
    remoteId: '',
    callStatus: CallStatus.IDLE,
    isAudioMuted: false,
    isVideoStopped: false,
  });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  // Parse URL param for auto-connecting
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const peerParam = params.get('peer');
    if (peerParam) {
      setTargetId(peerParam);
    }
  }, []);

  // Initialize Peer
  useEffect(() => {
    const initPeer = async () => {
      try {
        const PeerModule = (await import('peerjs')).default;
        const peer = new PeerModule();

        peer.on('open', (id) => {
          console.log('My peer ID is: ' + id);
          setPeerState((prev) => ({ ...prev, myId: id }));
        });

        peer.on('call', async (call) => {
          // Answer incoming call
          try {
             // Request permissions if not already granted
             let stream = localStream;
             if (!stream) {
                 stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                 setLocalStream(stream);
             }
             call.answer(stream);
             callRef.current = call;
             setPeerState((prev) => ({ ...prev, callStatus: CallStatus.CONNECTED, remoteId: call.peer }));

             call.on('stream', (userVideoStream) => {
                setRemoteStream(userVideoStream);
             });
             
             call.on('close', () => endCall());
             call.on('error', (err) => {
                 console.error("Call error", err);
                 endCall();
             });

             // Setup data connection if not exists
             if (!connRef.current) {
                 const conn = peer.connect(call.peer);
                 setupDataConnection(conn);
             }

          } catch (err) {
              console.error("Failed to answer call", err);
              setError("Could not access camera/microphone to answer.");
          }
        });

        peer.on('connection', (conn) => {
            setupDataConnection(conn);
        });

        peer.on('error', (err) => {
            console.error(err);
            if (err.type === 'peer-unavailable') {
                setError(`Peer ${targetId} not found.`);
                setPeerState(prev => ({...prev, callStatus: CallStatus.IDLE}));
            } else {
                setError("Connection error. Please refresh.");
            }
        });

        peerRef.current = peer;
      } catch (err) {
        console.error("Failed to load PeerJS", err);
        setError("Failed to initialize networking.");
      }
    };

    initPeer();

    return () => {
      peerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const setupDataConnection = (conn: DataConnection) => {
      connRef.current = conn;
      conn.on('open', () => {
          // Connection open
      });
      conn.on('data', (data: any) => {
          if (data && data.type === 'chat') {
              setMessages(prev => [...prev, {
                  id: Date.now().toString() + Math.random(),
                  sender: 'peer',
                  text: data.text,
                  timestamp: Date.now()
              }]);
              setShowChat(true); // Auto open chat on message
          }
      });
  };

  const startCall = async () => {
    if (!targetId || !peerRef.current) return;
    setError(null);
    setPeerState(prev => ({ ...prev, callStatus: CallStatus.CONNECTING }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      const call = peerRef.current.call(targetId, stream);
      callRef.current = call;

      call.on('stream', (userVideoStream) => {
        setPeerState(prev => ({ ...prev, callStatus: CallStatus.CONNECTED, remoteId: targetId }));
        setRemoteStream(userVideoStream);
      });

      call.on('close', () => endCall());
      call.on('error', (err) => {
          console.error("Call error", err);
          endCall();
      });

      // Data connection
      const conn = peerRef.current.connect(targetId);
      setupDataConnection(conn);

    } catch (err) {
      console.error("Failed to start call", err);
      setError("Could not access camera/microphone.");
      setPeerState(prev => ({ ...prev, callStatus: CallStatus.IDLE }));
    }
  };

  const endCall = () => {
    callRef.current?.close();
    connRef.current?.close();
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setPeerState(prev => ({ 
      ...prev, 
      callStatus: CallStatus.IDLE, 
      remoteId: '',
      isAudioMuted: false,
      isVideoStopped: false
    }));
    callRef.current = null;
    connRef.current = null;
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setPeerState(prev => ({ ...prev, isAudioMuted: !audioTrack.enabled }));
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setPeerState(prev => ({ ...prev, isVideoStopped: !videoTrack.enabled }));
      }
    }
  };

  const sendMessage = (text: string) => {
      const msg: Message = {
          id: Date.now().toString(),
          sender: 'me',
          text,
          timestamp: Date.now()
      };
      setMessages(prev => [...prev, msg]);

      if (connRef.current && connRef.current.open) {
          connRef.current.send({ type: 'chat', text });
      } else {
          // If no data connection but in call (shouldnt happen but safety)
          if (peerState.remoteId && peerRef.current) {
               const conn = peerRef.current.connect(peerState.remoteId);
               conn.on('open', () => {
                   conn.send({ type: 'chat', text });
                   setupDataConnection(conn);
               });
          }
      }
  };

  const copyInviteLink = () => {
      const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?peer=${peerState.myId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-white overflow-hidden relative">
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${showChat ? 'mr-0' : 'mr-0'}`}>
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
               <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                   <VideoFeed stream={null} label="" /> {/* Dummy hidden for icon usage */}
                   <div className="w-5 h-5 flex items-center justify-center font-bold text-white">G</div>
               </div>
               <span className="font-semibold text-lg tracking-tight text-white/90">GeminiConnect</span>
            </div>

            {peerState.callStatus === CallStatus.CONNECTED && (
                <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30 backdrop-blur-md">
                    Connected with {peerState.remoteId.substring(0,6)}...
                </div>
            )}
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4 flex gap-4 relative">
            {peerState.callStatus === CallStatus.IDLE || peerState.callStatus === CallStatus.CONNECTING ? (
                // Landing / Connect Screen
                <div className="w-full h-full flex flex-col items-center justify-center space-y-8 relative z-0">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
                    
                    <div className="text-center space-y-2 z-10">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-cyan-300">
                            P2P Video Call
                        </h1>
                        <p className="text-slate-400 max-w-md mx-auto">
                            Secure, peer-to-peer video calling with integrated Gemini AI assistance.
                        </p>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl w-full max-w-md z-10">
                        <div className="mb-6">
                            <label className="text-xs text-slate-400 uppercase font-semibold tracking-wider ml-1 mb-2 block">Share Invite Link</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-slate-800 rounded-xl px-4 py-3 text-slate-300 font-mono text-sm flex items-center overflow-hidden">
                                    {peerState.myId ? 
                                      `${window.location.host}/?peer=${peerState.myId.substring(0,6)}...` : 
                                      "Generating ID..."
                                    }
                                </div>
                                <button 
                                    onClick={copyInviteLink}
                                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl transition-colors flex items-center gap-2"
                                    title="Copy Invite Link"
                                >
                                    {copied ? <Check size={20} className="text-green-400"/> : <LinkIcon size={20} />}
                                    <span className="text-xs font-medium hidden sm:inline">{copied ? 'Copied' : 'Copy Link'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                            <div className="relative flex justify-center"><span className="bg-slate-900/50 px-2 text-slate-500 text-sm">OR</span></div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-semibold tracking-wider ml-1 mb-2 block">Join Friend</label>
                                <input
                                    type="text"
                                    placeholder="Paste friend's ID here..."
                                    value={targetId}
                                    onChange={(e) => setTargetId(e.target.value)}
                                    className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm"
                                />
                            </div>
                            <button
                                onClick={startCall}
                                disabled={!targetId || peerState.callStatus === CallStatus.CONNECTING}
                                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-4 rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {peerState.callStatus === CallStatus.CONNECTING ? (
                                    <>Connecting...</>
                                ) : (
                                    <><Phone size={20} /> {targetId ? 'Start Call' : 'Enter ID to Call'}</>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {error && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-900/50">
                            <Info size={16} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                </div>
            ) : (
                // In Call Layout
                <div className="flex-1 flex flex-col md:flex-row gap-4 h-full relative">
                    {/* Remote Stream (Main) */}
                    <div className="flex-1 relative rounded-3xl overflow-hidden bg-slate-900 shadow-2xl ring-1 ring-slate-700/50">
                        <VideoFeed stream={remoteStream} label="Remote" />
                        
                        {/* Local Stream (PIP) */}
                        <div className="absolute top-4 right-4 w-32 md:w-48 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-slate-800/50 z-20 transition-all hover:scale-105">
                             <VideoFeed stream={localStream} label="You" isLocal isMuted />
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Bottom Controls (Only visible when connected/connecting) */}
        {(peerState.callStatus !== CallStatus.IDLE) && (
             <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
                 <ControlBar
                     isAudioMuted={peerState.isAudioMuted}
                     isVideoStopped={peerState.isVideoStopped}
                     onToggleAudio={toggleAudio}
                     onToggleVideo={toggleVideo}
                     onEndCall={endCall}
                     onToggleChat={() => setShowChat(!showChat)}
                     showChat={showChat}
                 />
             </div>
        )}
      </div>

      {/* Sidebar (Chat + AI) */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-80 transform transition-transform duration-300 ease-in-out z-40 shadow-2xl ${
          showChat ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <ChatPanel 
            messages={messages} 
            onSendMessage={sendMessage}
            myId={peerState.myId}
        />
        {/* Mobile close button for sidebar */}
        <button 
            onClick={() => setShowChat(false)}
            className="sm:hidden absolute top-4 right-4 text-slate-400 hover:text-white p-2"
        >
            ✕
        </button>
      </div>

    </div>
  );
};

export default App;