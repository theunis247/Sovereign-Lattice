
import React, { useState } from 'react';
import { SecurityIncident } from '../types';

interface SecurityPanelProps {
  incidents: SecurityIncident[];
  onGenerateReport: (incident: SecurityIncident) => void;
  isGenerating: boolean;
}

const SecurityPanel: React.FC<SecurityPanelProps> = ({ incidents, onGenerateReport, isGenerating }) => {
  return (
    <div className="bg-zinc-900/50 border border-red-500/20 rounded-2xl flex flex-col h-full overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.05)]">
      <div className="p-4 border-b border-red-500/10 flex justify-between items-center bg-red-500/5">
        <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Intrusion Forensics</h3>
        <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded font-black animate-pulse">LIVE MONITOR</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center opacity-30">
            <div className="text-2xl mb-2">🛡️</div>
            <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-blue-400">Quantum Shard Integrity Verified.</p>
          </div>
        ) : (
          <div className="divide-y divide-red-500/10">
            {[...incidents].reverse().map((inc) => (
              <div key={inc.id} className="p-4 hover:bg-red-500/5 transition-colors group relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-red-500 mono tracking-tighter">
                      {inc.attackerIp}
                    </span>
                    <span className="text-[9px] text-gray-500 font-bold uppercase">{inc.location} • {inc.isp}</span>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${
                    inc.severity === 'Critical' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'
                  }`}>
                    {inc.severity}
                  </span>
                </div>
                
                <div className="text-[8px] text-gray-600 mono truncate mb-3">
                  SIG: {inc.quantumSignature}
                </div>

                <button 
                  onClick={() => onGenerateReport(inc)}
                  disabled={isGenerating}
                  className="w-full py-2 bg-zinc-800 border border-white/5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                >
                  {isGenerating ? 'Compiling Report...' : 'File Authority Report'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityPanel;
