
import React, { useState, useEffect } from 'react';
import { SolvedBlock, User } from '../types';
import { QBS_UNITS } from '../services/quantumLogic';

interface AdvancementPath {
  id: string;
  title: string;
  description: string;
  isRecommended: boolean;
  workingPaper: string;
}

interface DebatePoint {
  nodeId: string;
  role: 'PRAGMATIST' | 'VISIONARY' | 'ETHICIST';
  argument: string;
}

interface AdvancementCouncilProps {
  user: User;
  block: SolvedBlock;
  paths: AdvancementPath[];
  debate: DebatePoint[];
  onFinalize: (pathId: string, fundingQuarks: number) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const AdvancementCouncil: React.FC<AdvancementCouncilProps> = ({ 
  user, block, paths, debate, onFinalize, onCancel, isProcessing 
}) => {
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [fundingAmount, setFundingAmount] = useState<number>(1000); // Default 1000 Quarks
  const [visibleDebateIndex, setVisibleDebateIndex] = useState(0);

  const nextMk = (block.advancementLevel || 1) + 1;
  const xpReward = nextMk * 750;

  useEffect(() => {
    if (debate.length > 0 && visibleDebateIndex < debate.length) {
      const timer = setTimeout(() => {
        setVisibleDebateIndex(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [debate, visibleDebateIndex]);

  const handleCommit = () => {
    if (selectedPathId) {
      onFinalize(selectedPathId, fundingAmount);
    }
  };

  const currentPath = paths.find(p => p.id === selectedPathId);
  const userQuarks = Math.round(user.balance * QBS_UNITS.QRK);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500">
      <div className="bg-zinc-900 border border-orange-500/30 rounded-[4rem] w-full max-w-6xl h-[90vh] flex flex-col shadow-[0_0_100px_rgba(247,147,26,0.1)] relative overflow-hidden">
        
        {/* Background Grid Ambience */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#f7931a 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        {/* Header */}
        <div className="p-10 border-b border-white/5 flex justify-between items-center relative z-10 bg-black/20">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/20">
                <span className="text-3xl font-black text-black italic">Σ</span>
             </div>
             <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Lattice Advancement Council</h2>
                <div className="flex items-center gap-3 mt-1">
                   <span className="text-[10px] text-orange-500 font-bold tracking-[0.4em] uppercase">Advancing: {block.shardId}</span>
                   <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                   <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest italic">Consensus Argument Underway</span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="text-right">
                <span className="text-[8px] text-blue-400 font-black uppercase tracking-widest block">Deliberation Reward</span>
                <span className="text-xl font-black text-white">+{xpReward} XP</span>
             </div>
             <button onClick={onCancel} className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-white text-3xl font-bold hover:bg-red-500/20 hover:text-red-500 transition-all">×</button>
          </div>
        </div>

        {/* Main Content: Split View */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          
          {/* Left: Debate Floor & Briefing */}
          <div className="flex-1 border-r border-white/5 flex flex-col min-h-0">
             <div className="p-6 border-b border-white/5 bg-black/40 flex justify-between items-center">
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.4em]">Live Node Deliberation</span>
                {selectedPathId && <span className="text-[8px] text-blue-400 font-black uppercase tracking-widest animate-pulse">Manuscript Preview Active</span>}
             </div>
             
             <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                {/* Detailed Briefing when path is selected */}
                {selectedPathId ? (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-700 space-y-8">
                     <section className="bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">📜</div>
                           <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Scientific Working Paper Preview</h3>
                        </div>
                        <div className="prose prose-invert prose-sm">
                           <p className="text-gray-400 leading-relaxed font-serif italic text-base">
                              {currentPath?.workingPaper}
                           </p>
                        </div>
                        <div className="flex justify-end">
                           <span className="text-[8px] text-gray-600 font-black uppercase tracking-[0.5em]">Authored via Synthetic Intelligence Cluster</span>
                        </div>
                     </section>
                  </div>
                ) : (
                  <>
                    {debate.slice(0, visibleDebateIndex).map((point, i) => (
                      <div key={i} className={`flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-500`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                              point.role === 'PRAGMATIST' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              point.role === 'VISIONARY' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {point.role.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">{point.nodeId}</span>
                              <span className={`text-[8px] font-bold uppercase tracking-[0.2em] ${
                                point.role === 'PRAGMATIST' ? 'text-blue-500' :
                                point.role === 'VISIONARY' ? 'text-purple-500' :
                                'text-amber-500'
                              }`}>{point.role} ANALYST</span>
                            </div>
                        </div>
                        <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 text-sm text-gray-300 italic font-medium leading-relaxed shadow-inner">
                            "{point.argument}"
                        </div>
                      </div>
                    ))}
                    {visibleDebateIndex < debate.length && (
                      <div className="flex items-center gap-3 text-orange-500 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Peer Submission...</span>
                      </div>
                    )}
                  </>
                )}
             </div>
          </div>

          {/* Right: Path Selection & Funding */}
          <div className="w-[450px] bg-black/40 flex flex-col p-10 overflow-y-auto custom-scrollbar">
             <div className="space-y-10">
                <div className="space-y-4">
                   <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.3em]">Select Advancement Path</h3>
                   <div className="grid grid-cols-1 gap-4">
                      {paths.map((path) => (
                        <button 
                          key={path.id}
                          onClick={() => setSelectedPathId(path.id)}
                          className={`p-6 rounded-3xl border text-left transition-all duration-300 relative group overflow-hidden ${
                            selectedPathId === path.id 
                            ? 'bg-orange-500/10 border-orange-500 text-white shadow-2xl scale-102' 
                            : 'bg-zinc-800/30 border-white/5 hover:border-white/10 text-gray-400 hover:scale-101'
                          }`}
                        >
                           {path.isRecommended && (
                             <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-white text-[7px] font-black uppercase tracking-[0.2em] rounded-bl-xl shadow-lg border-l border-b border-white/10">
                                Recommended Path
                             </div>
                           )}
                           {selectedPathId === path.id && !path.isRecommended && (
                             <div className="absolute top-0 right-0 p-3">
                                <span className="text-orange-500 font-black">✓</span>
                             </div>
                           )}
                           <h4 className={`text-sm font-black uppercase mb-1 ${selectedPathId === path.id ? 'text-orange-500' : ''}`}>{path.title}</h4>
                           <p className="text-[10px] leading-relaxed opacity-60 font-medium">{path.description}</p>
                        </button>
                      ))}
                   </div>
                </div>

                {selectedPathId && (
                  <div className="bg-zinc-900 border border-white/10 p-8 rounded-[3rem] space-y-6 animate-in zoom-in-95 duration-300">
                     <div className="space-y-4">
                        <div className="flex justify-between items-center">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Commit Magnitude (Quarks)</label>
                           <span className="text-[10px] text-orange-500 font-bold mono">{fundingAmount.toLocaleString()} QRK</span>
                        </div>
                        <input 
                          type="range" min="100" max={Math.min(userQuarks, 10000)} step="100"
                          value={fundingAmount} onChange={e => setFundingAmount(parseInt(e.target.value))}
                          className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <div className="flex justify-between text-[8px] text-gray-600 font-bold uppercase">
                           <span>Min: 100</span>
                           <span>Your Max: {userQuarks.toLocaleString()}</span>
                        </div>
                     </div>

                     <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">
                          Advancement to Tier Mk {nextMk}
                        </p>
                        <p className="text-[7px] text-gray-600 mt-1 uppercase font-bold">
                           Deployment burns magnitude to harden the discovery.
                        </p>
                     </div>

                     <button 
                       onClick={handleCommit}
                       disabled={isProcessing || fundingAmount > userQuarks}
                       className="w-full py-5 bg-orange-500 text-black rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-orange-400 shadow-2xl shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
                     >
                        {isProcessing ? 'SYNCHRONIZING LATTICE...' : 'FINALIZE ADVANCEMENT'}
                     </button>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Footer Ribbon */}
        <div className="p-8 bg-black/60 border-t border-white/5 flex justify-center">
           <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.5em] text-center max-w-2xl">
              CONFERENCE PROTOCOL ENABLED // SECURED BY 10,000 NODE CONSENSUS // MK {nextMk} EVOLUTION PENDING
           </p>
        </div>
      </div>
    </div>
  );
};

export default AdvancementCouncil;
