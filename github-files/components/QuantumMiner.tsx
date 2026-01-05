
import React, { useState, useMemo, useEffect } from 'react';
import { QuantumProof } from '../types';
import LatticeLogo from './LatticeLogo';

interface QuantumMinerProps {
  isMining: boolean;
  progress: number;
  problem: string;
  onStart: () => void;
  balance: number;
  lastProof?: QuantumProof;
  isVerifying: boolean;
  collaborators: string[];
  shardId?: string;
  solvedCount: number;
  integrityStatus: 'SECURE' | 'PROBING' | 'COMPROMISED' | 'CALIBRATING';
  publicRemaining?: number;
  miningActive?: boolean;
  activeInitiative?: string;
}

const QuantumMiner: React.FC<QuantumMinerProps> = ({ 
  isMining, progress, problem, onStart, balance, lastProof, isVerifying, collaborators, shardId, solvedCount, integrityStatus, publicRemaining = 0, miningActive = false, activeInitiative
}) => {
  const [currentTask, setCurrentTask] = useState('Standby');

  const QUARKS_PER_TOKEN = 1000000000; 
  const totalQuarksOwned = Math.round(balance * QUARKS_PER_TOKEN);

  const protocolSteps = [
    'Stage 1: Establishing Cosmic Constant Parity...',
    'Stage 2: Modeling Navier-Stokes Turbulence...',
    'Stage 3: Testing Schwarzschild Radius Singularity...',
    'Stage 4: Simulating Neural Consciousness Origin...',
    'Stage 5: Finalizing Shard Entropy Resolution...'
  ];

  useEffect(() => {
    if (isMining) {
      const stepIndex = Math.floor((progress / 100) * protocolSteps.length);
      setCurrentTask(protocolSteps[Math.min(stepIndex, protocolSteps.length - 1)]);
    } else {
      setCurrentTask('Lattice Idle');
    }
  }, [isMining, progress]);

  const hexStream = useMemo(() => {
    return Array.from({ length: 4 }, () => Math.random().toString(16).substring(2, 30).toUpperCase()).join('\n');
  }, [progress]);

  return (
    <div className={`flex flex-col gap-4 h-full relative ${!miningActive ? 'grayscale pointer-events-none opacity-60' : ''}`}>
      {!miningActive && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-sm rounded-[2.5rem] border border-red-500/20">
           <LatticeLogo size="lg" variant="monochrome" className="mb-4 opacity-50" />
           <span className="text-[10px] text-red-500 font-black uppercase tracking-[0.4em] text-center">Mining Access Expired</span>
           <p className="text-[8px] text-gray-500 mt-2 uppercase font-black text-center">Renew Sovereign Lease in Wallet</p>
        </div>
      )}
      
      <div className={`bg-zinc-900/50 border transition-all duration-500 p-6 rounded-[2.5rem] flex flex-col gap-6 shadow-2xl relative overflow-hidden group ${
        integrityStatus === 'COMPROMISED' ? 'border-red-500 shadow-red-500/20' : 'border-white/10'
      }`}>
        <div className={`absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(247,147,26,0.03),transparent_70%)]`}></div>

        <div className="flex justify-between items-center relative z-10">
          <div className="flex flex-col">
            <h3 className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Sovereign Magnitude</h3>
            <span className="text-orange-500 font-bold text-2xl leading-tight drop-shadow-[0_0_10px_rgba(247,147,26,0.3)]">
              {balance.toFixed(6)} <span className="text-[10px] text-white/50 tracking-normal uppercase font-black">QBS</span>
            </span>
            <span className="text-[8px] text-gray-500 font-mono mt-1">({totalQuarksOwned.toLocaleString()} Quarks)</span>
          </div>
          <div className="flex flex-col items-end">
             <div className="bg-black/40 px-2 py-0.5 rounded-full border border-green-500/30 mb-1">
                <span className="text-[7px] font-black uppercase text-green-500">PoUW: {isVerifying ? 'PEER_REVIEW' : 'ACTIVE'}</span>
             </div>
            <span className="text-white font-bold text-[10px] mono">Resolutions: {solvedCount}</span>
          </div>
        </div>

        {activeInitiative && (
          <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-2xl animate-in slide-in-from-top-2 duration-500">
             <span className="text-[8px] text-orange-500 font-black uppercase tracking-widest block mb-1">Active Initiative Task:</span>
             <p className="text-[10px] text-white font-bold uppercase truncate">{activeInitiative}</p>
          </div>
        )}

        <div className={`relative h-56 bg-black/95 rounded-3xl border overflow-hidden flex items-center justify-center transition-all duration-500 ${
          isMining || isVerifying ? 'border-orange-500/40 shadow-[inset_0_0_50px_rgba(247,147,26,0.2)]' : 'border-white/5'
        }`}>
          {(isMining || isVerifying) && (
            <div className="absolute inset-0 opacity-10 font-mono text-[8px] p-4 text-orange-500 overflow-hidden leading-relaxed break-all select-none">
              {hexStream}
              {hexStream}
            </div>
          )}

          {!isMining && !isVerifying ? (
            <div className="flex flex-col items-center gap-4 opacity-30 group-hover:opacity-60 transition-opacity text-center px-4">
              <LatticeLogo size="lg" variant="monochrome" className="grayscale" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Universal Shard Standby</span>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col justify-center items-center">
              <div className="absolute top-2 left-2 flex gap-1">
                 <div className="w-1 h-1 rounded-full bg-orange-500 animate-ping"></div>
                 <span className="text-[6px] text-orange-500 font-black uppercase">
                   {isVerifying ? 'Skeptical Review Cycle...' : 'Solving Frontier Fragment...'}
                 </span>
              </div>
              
              <svg className={`w-48 h-48 ${isVerifying ? 'opacity-20 animate-pulse' : 'opacity-40'}`} viewBox="0 0 200 200">
                <g className="translate-x-[100px] translate-y-[100px]">
                   <circle r="80" fill="none" stroke="#f7931a" strokeWidth="0.1" strokeDasharray="1 10" className="animate-[spin_40s_linear_infinite]" />
                   <circle r="60" fill="none" stroke="#f7931a" strokeWidth="0.5" strokeDasharray="10 5" className="animate-[spin_10s_linear_infinite]" />
                   <circle r="40" fill="none" stroke={isVerifying ? "#3b82f6" : "#f7931a"} strokeWidth="2" strokeDasharray="20 40" className="animate-[spin_3s_linear_infinite]" />
                   <path d="M-40,0 L40,0 M0,-40 L0,40" stroke="#f7931a" strokeWidth="0.5" opacity="0.2" />
                </g>
              </svg>

              <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none p-6">
                 <span className={`text-[12px] font-black tracking-widest ${isVerifying ? 'text-blue-400' : 'text-orange-500'} animate-pulse uppercase`}>
                   {isVerifying ? 'Council Deliberation' : `Resolution: ${Math.floor(progress)}%`}
                 </span>
                 <p className="text-[8px] text-gray-400 mt-4 uppercase font-black text-center leading-relaxed max-w-xs">
                   {isMining ? problem : currentTask}
                 </p>
              </div>
            </div>
          )}
        </div>

        {isMining || isVerifying ? (
          <div className="space-y-4">
            <div className="w-full bg-black/80 h-3 rounded-full overflow-hidden p-[1px] border border-white/5 relative">
              <div 
                className={`h-full transition-all duration-300 relative ${isVerifying ? 'bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-orange-600 shadow-[0_0_20px_rgba(247,147,26,0.5)]'}`}
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between items-center text-[7px] font-black uppercase text-gray-500 tracking-[0.2em] italic">
               <span className="flex items-center gap-1">
                 <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                 Scientific Coherence: Stable
               </span>
               <span className="text-orange-500">Recursive Proof v{solvedCount + 1}</span>
            </div>
          </div>
        ) : (
          <button 
            onClick={onStart}
            disabled={publicRemaining <= 0 || !miningActive}
            className={`group/btn relative w-full h-16 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95 overflow-hidden ${publicRemaining <= 0 || !miningActive ? 'bg-zinc-800 text-gray-600 cursor-not-allowed' : 'bg-orange-500 text-black hover:bg-orange-400 shadow-orange-500/10'}`}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500"></div>
            <span className="relative z-10">{!miningActive ? 'Access Denied' : publicRemaining <= 0 ? 'Discovery Cap Reached' : 'Resolve Universal Shard'}</span>
          </button>
        )}
        
        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
           <div className="flex justify-between items-center">
              <span className="text-[7px] text-gray-500 font-black uppercase">Global Discovery Remaining</span>
              <span className="text-[9px] text-orange-500 font-black mono">{publicRemaining.toFixed(3)} QBS</span>
           </div>
           <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500" style={{ width: `${(publicRemaining / 9000) * 100}%` }}></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumMiner;
