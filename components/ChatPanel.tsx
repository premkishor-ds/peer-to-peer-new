import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User } from 'lucide-react';
import { Message } from '../types';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  myId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, myId }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles className="text-indigo-400" size={18} />
          Chat
        </h2>
        <p className="text-xs text-slate-400 mt-1">Peer-to-peer conversation</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-10 opacity-50">
            <Sparkles size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 text-sm">No messages yet.</p>
            <p className="text-slate-500 text-xs mt-2">Start the conversation!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                msg.sender === 'me'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : msg.sender === 'system'
                  ? 'bg-slate-800 text-slate-400 w-full text-center text-xs py-1 rounded-lg'
                  : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
              }`}
            >
              {msg.sender !== 'system' && (
                <div className="text-[10px] opacity-70 mb-1 flex items-center gap-1">
                  {msg.sender === 'me' ? <User size={10} /> : <User size={10} />}
                  {msg.sender === 'me' ? 'You' : 'Peer'}
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex items-end gap-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700 focus-within:border-indigo-500/50 focus-within:bg-slate-800 transition-all">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none max-h-24 py-2 px-1"
            rows={1}
            style={{ minHeight: '36px' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="mt-2 flex justify-between items-center text-[10px] text-slate-600">
          <span>{myId ? `ID: ${myId.substring(0, 8)}...` : 'Connecting...'}</span>
        </div>
      </div>
    </div>
  );
};