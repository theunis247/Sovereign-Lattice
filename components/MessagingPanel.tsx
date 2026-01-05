
import React, { useState, useEffect, useRef } from 'react';
import { SecureMessage } from '../types';

interface MessagingPanelProps {
  onSend: (text: string) => void;
  messages: SecureMessage[];
  canSend: boolean;
  cost: number;
  currentUserId: string;
  isTyping?: boolean;
  selectedContextName?: string;
  isGroup?: boolean;
  messagingActive?: boolean;
}

const MessagingPanel: React.FC<MessagingPanelProps> = ({ 
  onSend, 
  messages, 
  canSend, 
  cost, 
  currentUserId,
  isTyping,
  selectedContextName,
  isGroup,
  messagingActive = false
}) => {
  const [input, setInput] = useState('');
  const [isBursting, setIsBursting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && canSend && messagingActive) {
      setIsBursting(true);
      setTimeout(() => {
        onSend(input);
        setInput('');
        setIsBursting(false);
      }, 950);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['text-blue-400', 'text-purple-400', 'text-green-400', 'text-pink-400', 'text-orange-400'];
    const idx = (name?.length || 0) % colors.length;
    return colors[idx];
  };

  return (
    <div className="flex flex-col gap-4 h-full relative">
      <div ref={scrollRef} className="flex-1 bg-black/20 rounded-[3rem] border border-white/5 overflow-y-auto p-8 space-y-6 custom-scrollbar flex flex-col-reverse shadow-inner relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(247,147,26,0.02),transparent_70%)]"></div>

        {isBursting && (
          <div className="flex flex-col items-center justify-center p-8 bg-orange-500/5 rounded-[3rem] border border-dashed border-orange-500/20 animate-in zoom-in-95 duration-300 mb-4">
            <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.6em] animate-pulse">Broadcasting Entropy Shard...</span>
          </div>
        )}

        {isTyping && (
          <div className="flex flex-col items-start animate-in slide-in-from-left-4 mb-4">
            <div className="bg-zinc-800/80 p-4 rounded-3xl rounded-bl-none border border-white/10 flex gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
            </div>
          </div>
        )}

        {messages.length === 0 && !isTyping && !isBursting && (
          <div className="h-full flex flex-col items-center justify-center text-gray-700 text-center px-12 opacity-30 space-y-8">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-800 flex items-center justify-center text-4xl grayscale">🛡️</div>
            <div className="space-y-3">
               <h4 className="font-black uppercase tracking-[0.5em] text-white text-sm">Sovereign Tunnel Secured</h4>
               <p className="text-[11px] leading-relaxed max-w-xs font-medium uppercase tracking-widest italic">
                 Messages are split into universal shards and transmitted via non-local entanglement.
               </p>
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isMe = m.senderAddress === currentUserId;
          return (
            <div 
              key={m.id} 
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-6 duration-700 mb-2`}
            >
              {!isMe && isGroup && (
                <span className={`text-[8px] font-black uppercase mb-1 ml-4 tracking-widest ${getAvatarColor(m.senderName || '')}`}>
                  Node: {m.senderName || 'Unknown Shard'}
                </span>
              )}
              
              <div className={`max-w-[75%] p-5 rounded-[2.2rem] border relative group transition-all duration-300 ${
                isMe 
                  ? 'bg-orange-500/10 border-orange-500/20 text-white rounded-br-none hover:bg-orange-500/20' 
                  : m.isCompromised 
                    ? 'bg-red-950/40 border-red-500/60 text-red-100 rounded-bl-none animate-shake'
                    : 'bg-zinc-900 border-white/5 text-gray-200 rounded-bl-none hover:border-white/20'
              }`}>
                <p className="text-sm leading-relaxed font-medium">{m.text}</p>
                <div className={`absolute bottom-[-20px] ${isMe ? 'right-2' : 'left-2'} opacity-0 group-hover:opacity-100 transition-opacity z-30`}>
                   <span className="text-[7px] text-gray-500 font-black uppercase bg-black px-2 py-1 rounded-full border border-white/10">Sig: {m.tokenHash.substring(0, 8)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-2 px-3">
                <span className="text-[7px] text-gray-600 font-bold tracking-widest opacity-60">
                  {m.timestamp.split(' ')[1] || m.timestamp}
                </span>
                {isMe && <span className="text-[8px] text-blue-500 font-black">✓✓</span>}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="relative p-2 bg-zinc-900/80 rounded-[3rem] border border-white/10 focus-within:border-orange-500/30 transition-all duration-500 shadow-2xl">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500/30 text-lg">₿</div>
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={!messagingActive ? "Sovereign Lease Expired..." : `Exchange Shards with ${selectedContextName || 'Node'}...`}
          disabled={!canSend || !messagingActive || isBursting}
          className="w-full bg-transparent py-5 pl-12 pr-44 text-sm focus:outline-none transition-all placeholder:text-gray-700 font-medium text-white"
        />
        <button 
          type="submit"
          disabled={!canSend || !input.trim() || !messagingActive || isBursting}
          className={`absolute right-2 top-2 bottom-2 px-8 rounded-full text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 ${
            canSend && input.trim() && messagingActive && !isBursting
              ? 'bg-orange-500 text-black hover:bg-orange-400 active:scale-95' 
              : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          {isBursting ? 'Encoding...' : 'Broadcast'}
        </button>
      </form>
      
      <div className="flex justify-between px-10 opacity-30 -mt-2">
        <span className="text-[7px] font-black uppercase tracking-widest text-gray-500">Quantum Shard Integrity Protocol v9.4</span>
        <span className="text-[7px] font-black uppercase tracking-widest text-gray-500">Lattice Cost: {cost.toFixed(12)} QBS</span>
      </div>
    </div>
  );
};

export default MessagingPanel;
