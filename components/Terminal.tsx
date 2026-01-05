
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-black/80 border border-orange-500/30 rounded-lg p-4 h-64 overflow-hidden flex flex-col shadow-[0_0_20px_rgba(247,147,26,0.1)]">
      <div className="flex items-center justify-between mb-2 border-b border-orange-500/20 pb-1">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Quantum Node Output</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto mono text-xs space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2">
            <span className="text-gray-500">[{log.timestamp}]</span>
            <span className={
              log.type === 'error' ? 'text-red-400 font-bold' :
              log.type === 'warning' ? 'text-yellow-400' :
              log.type === 'success' ? 'text-green-400 font-bold' :
              'text-blue-300'
            }>
              {log.type === 'error' ? '!! ' : ''}{log.message}
            </span>
          </div>
        ))}
        {logs.length === 0 && <div className="text-gray-600 animate-pulse">Initializing quantum state...</div>}
      </div>
    </div>
  );
};

export default Terminal;
