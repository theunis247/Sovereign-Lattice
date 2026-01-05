
import React, { useMemo, useState, useEffect } from 'react';
import { User, Proposal, UserVote } from '../types';
import { QBS_UNITS } from '../services/quantumLogic';
import LatticeLogo from './LatticeLogo';

interface GovernanceViewProps {
  user: User;
  proposals: Proposal[];
  onVote: (proposalId: string, type: 'FOR' | 'AGAINST', weightInQuarks: number) => void;
  onNewProposal: (proposal: Partial<Proposal>) => void;
  onExecute: (proposalId: string) => void;
  onJoin: (proposalId: string) => void;
}

const GovernanceView: React.FC<GovernanceViewProps> = ({ user, proposals, onVote, onNewProposal, onExecute, onJoin }) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inspectedProposal, setInspectedProposal] = useState<Proposal | null>(null);
  const [voteAmounts, setVoteAmounts] = useState<Record<string, string>>({});
  
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<'ECONOMIC' | 'SCIENTIFIC' | 'SECURITY'>('SCIENTIFIC');

  const totalWeightQBS = user.balance + (user.stakedBalance || 0);
  const totalWeightQuarks = Math.round(totalWeightQBS * QBS_UNITS.QRK);
  const repBonus = (user.reputationScore || 0) / 1000;
  const rankMultiplier = 1 + repBonus;

  const handleVoteAction = (proposalId: string, type: 'FOR' | 'AGAINST') => {
    const amountStr = voteAmounts[proposalId] || '1000';
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0 || amount > totalWeightQuarks) return;
    onVote(proposalId, type, amount);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    onNewProposal({ title: newTitle, description: newDesc, category: newCategory });
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  const filteredProposals = proposals.filter(p => 
    activeTab === 'ACTIVE' ? p.status === 'ACTIVE' : (p.status !== 'ACTIVE')
  );

  return (
    <div className="flex-1 flex flex-col gap-10 animate-in fade-in slide-in-from-right-6 duration-700 overflow-y-auto custom-scrollbar p-2 pb-40 w-full max-w-[1400px] mx-auto">
      
      {/* HEADER: GOVERNANCE DASHBOARD */}
      <section className="bg-zinc-900 border border-purple-500/20 p-12 rounded-[4rem] relative overflow-hidden shadow-3xl shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(168,85,247,0.1),transparent_60%)]"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-6">
             <div className="flex items-center gap-3">
               <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#a855f7]"></span>
               <span className="text-[11px] text-purple-400 font-black uppercase tracking-[0.5em]">Council Access Terminal</span>
             </div>
             <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none italic font-serif">Sovereign <br/> Consensus</h2>
             <div className="flex flex-wrap gap-4">
                <div className="bg-black/40 px-6 py-2 rounded-2xl border border-white/5 flex items-center gap-3">
                   <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Rank</span>
                   <span className="text-xs font-black text-white uppercase italic">{user.governanceRank || "Node Aspirant"}</span>
                </div>
                <div className="bg-purple-500/10 px-6 py-2 rounded-2xl border border-purple-500/20 flex items-center gap-3">
                   <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest">Multiplier</span>
                   <span className="text-xs font-black text-purple-300 mono">{rankMultiplier.toFixed(2)}x</span>
                </div>
             </div>
             <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-xl">
               Every initiative broadcasted requires a <span className="text-white font-black">500 QRK</span> stake. Once passed, <span className="text-purple-400 font-black">1%</span> of total staked funds rewards the proposer, while <span className="text-green-400 font-black">99%</span> is re-injected into the Lattice liquidity pool.
             </p>
             <button 
               onClick={() => setShowCreateModal(true)}
               className="group relative px-10 py-4 bg-purple-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] overflow-hidden shadow-2xl transition-all active:scale-95"
             >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <span className="relative z-10">+ Broadcast Universal Initiative</span>
             </button>
          </div>
          
          <div className="flex flex-col gap-6 w-full lg:w-auto min-w-[380px]">
            <div className="bg-black/60 p-10 rounded-[3.5rem] border border-white/5 text-center shadow-inner relative overflow-hidden group">
               <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <span className="block text-[10px] text-gray-500 font-black uppercase mb-4 tracking-[0.3em]">Your Adjusted Vote Power</span>
               <div className="flex items-center justify-center gap-3">
                  <LatticeLogo size="md" variant="gold" />
                  <span className="text-6xl font-black text-purple-400 mono leading-none tracking-tighter italic">
                     {(totalWeightQBS * rankMultiplier).toFixed(3)}
                  </span>
               </div>
               <div className="mt-6 space-y-1">
                  <span className="text-sm font-black text-white mono">{totalWeightQuarks.toLocaleString()} Quarks</span>
                  <div className="h-1.5 w-40 mx-auto bg-zinc-800 rounded-full overflow-hidden mt-3">
                     <div className="h-full bg-purple-500" style={{ width: `${Math.min(user.xp / 1000, 100)}%` }}></div>
                  </div>
                  <p className="text-[8px] text-gray-700 font-black uppercase tracking-widest pt-2">Influence Level: {user.level}</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* TABS & FEED */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
           <div className="flex gap-10">
              <button 
                onClick={() => setActiveTab('ACTIVE')}
                className={`text-[12px] font-black uppercase tracking-[0.4em] transition-all relative pb-2 ${activeTab === 'ACTIVE' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
              >
                Polls In Progress
                {activeTab === 'ACTIVE' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 rounded-full animate-in slide-in-from-left"></div>}
              </button>
              <button 
                onClick={() => setActiveTab('ARCHIVED')}
                className={`text-[12px] font-black uppercase tracking-[0.4em] transition-all relative pb-2 ${activeTab === 'ARCHIVED' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
              >
                Finalized Resolutions
                {activeTab === 'ARCHIVED' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 rounded-full animate-in slide-in-from-left"></div>}
              </button>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 font-black uppercase">Consensus Threshold:</span>
              <span className="text-[9px] text-green-500 font-black mono">66.7%</span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {filteredProposals.map((p) => {
            const totalVotes = p.votesFor + p.votesAgainst;
            const pctFor = totalVotes > 0 ? (p.votesFor / totalVotes) * 100 : 0;
            const quorumProgress = Math.min((totalVotes / (p.requiredWeight || 100)) * 100, 100);
            const isAssigned = user.activeInitiativeId === p.id;
            
            return (
              <div 
                key={p.id} 
                onClick={() => setInspectedProposal(p)}
                className={`bg-zinc-900/60 border p-10 rounded-[4rem] flex flex-col gap-10 relative overflow-hidden group hover:bg-zinc-900/90 transition-all shadow-xl cursor-pointer ${isAssigned ? 'border-orange-500/50 shadow-orange-500/10' : 'border-white/10'}`}
              >
                 {isAssigned && (
                   <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-black px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest z-20 shadow-xl">
                      Currently Assigned
                   </div>
                 )}
                 <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <span className="text-8xl font-black italic">{p.category?.charAt(0)}</span>
                 </div>
                 
                 <div className="flex justify-between items-start">
                    <div className="max-w-[75%]">
                       <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${
                             p.category === 'ECONOMIC' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                             p.category === 'SCIENTIFIC' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                             'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {p.category}
                          </span>
                          <span className="text-[9px] text-gray-600 font-bold mono">{p.id}</span>
                       </div>
                       <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-tight font-serif">{p.title}</h3>
                    </div>
                    <div className="text-right">
                       <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase ${
                          p.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border-green-500/20 animate-pulse' :
                          p.status === 'PASSED' ? 'bg-blue-500 text-white border-blue-400' :
                          p.status === 'EXECUTING' ? 'bg-orange-500 text-black border-orange-400' :
                          'bg-zinc-800 text-gray-500 border-white/5'
                       }`}>
                          {p.status}
                       </span>
                    </div>
                 </div>
                 
                 <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 relative shadow-inner">
                    <p className="text-sm text-gray-300 leading-relaxed font-medium italic">
                      "{p.description}"
                    </p>
                    <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[9px] uppercase font-black text-gray-600">
                       <span>Proposer: <span className="text-white">{p.proposer}</span></span>
                       <span>Funds Staked: <span className="text-purple-400">{(p.totalQuarksStaked || 0).toLocaleString()} QRK</span></span>
                    </div>
                 </div>

                 {/* PROGRESS BARS */}
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest px-2">
                          <span className="text-green-500">Affirm: {p.votesFor.toFixed(2)}</span>
                          <span className="text-red-500">Reject: {p.votesAgainst.toFixed(2)}</span>
                       </div>
                       <div className="w-full h-4 bg-black/80 rounded-full overflow-hidden p-1 border border-white/5 flex relative">
                          <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-1000 z-10" style={{ width: `${pctFor}%` }}></div>
                          <div className="h-full bg-red-500/20 rounded-full transition-all duration-1000 flex-1"></div>
                       </div>
                    </div>
                 </div>

                 <div className="mt-auto flex justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic">Click to Inspect Resolution Shard</span>
                 </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INSPECTION MODAL */}
      {inspectedProposal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-500">
           <div className="bg-zinc-900 border border-purple-500/40 rounded-[4rem] w-full max-w-5xl h-[90vh] flex flex-col shadow-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
              
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-zinc-950 border border-purple-500/30 rounded-2xl flex items-center justify-center shadow-xl">
                       <LatticeLogo size="lg" variant="gold" />
                    </div>
                    <div>
                       <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic font-serif">{inspectedProposal.title}</h2>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em]">INITIATIVE: {inspectedProposal.id}</span>
                          <div className={`px-2 py-0.5 rounded-full border border-green-500/20 bg-green-500/10 text-[8px] font-black uppercase text-green-500`}>
                             {inspectedProposal.status}
                          </div>
                       </div>
                    </div>
                 </div>
                 <button 
                    onClick={() => setInspectedProposal(null)}
                    className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center hover:bg-red-500/20 text-white text-3xl font-bold transition-all"
                 >×</button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    
                    {/* Scientific Context */}
                    <div className="space-y-10">
                       <section className="space-y-4">
                          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-l-2 border-orange-500 pl-4">Current Scientific Baseline</h3>
                          <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                             <p className="text-sm text-gray-300 italic font-medium leading-relaxed">
                               "{inspectedProposal.scientificBaseline || 'Foundational data for this initiative is currently being synthesized across the lattice.'}"
                             </p>
                          </div>
                       </section>

                       <section className="space-y-4">
                          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-l-2 border-blue-500 pl-4">Proposed Evolution Path</h3>
                          <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                             <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                {inspectedProposal.evolutionPath || 'No specific evolution mapping transmitted yet.'}
                             </p>
                          </div>
                       </section>

                       <section className="space-y-4">
                          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-l-2 border-purple-500 pl-4">Lattice Control Parameters</h3>
                          <div className="grid grid-cols-1 gap-2">
                             {(inspectedProposal.technicalParameters || ["Registry Sync: Required", "PoUW Intensity: Dynamic"]).map((param, i) => (
                               <div key={i} className="bg-zinc-800/40 p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-zinc-800/60 transition-colors">
                                  <span className="text-[10px] font-black text-white mono uppercase">{param.split(':')[0]}</span>
                                  <span className="text-[10px] font-bold text-purple-400 mono">{param.split(':')[1] || 'ENABLED'}</span>
                               </div>
                             ))}
                          </div>
                       </section>
                    </div>

                    {/* Voting / Action Panel */}
                    <div className="space-y-8 flex flex-col">
                       <div className="bg-black/60 border border-white/10 p-10 rounded-[3.5rem] space-y-10 flex-1 flex flex-col justify-center">
                          <div className="text-center space-y-2">
                             <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em]">Consensus Standing</h4>
                             <div className="flex items-center justify-center gap-4">
                                <span className="text-6xl font-black text-green-500 mono italic">{(inspectedProposal.votesFor / (inspectedProposal.votesFor + inspectedProposal.votesAgainst || 1) * 100).toFixed(1)}%</span>
                                <span className="text-sm font-black text-gray-700 uppercase">AFFIRMATIVE</span>
                             </div>
                          </div>

                          {inspectedProposal.status === 'ACTIVE' ? (
                             <div className="space-y-8">
                                <div className="space-y-4">
                                   <div className="flex justify-between items-center px-2">
                                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Your Weight Allocation (Quarks)</label>
                                      <span className="text-[10px] text-purple-400 font-bold mono">Available: {totalWeightQuarks.toLocaleString()}</span>
                                   </div>
                                   <input 
                                     type="number" 
                                     value={voteAmounts[inspectedProposal.id] || '1000'}
                                     onChange={(e) => setVoteAmounts({...voteAmounts, [inspectedProposal.id]: e.target.value})}
                                     className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-2xl font-black text-white outline-none focus:border-purple-500 mono text-center"
                                     placeholder="Amount..."
                                   />
                                </div>
                                <div className="flex gap-6">
                                   <button 
                                      onClick={() => handleVoteAction(inspectedProposal.id, 'FOR')}
                                      className="flex-1 py-8 bg-green-600/10 text-green-500 border border-green-500/20 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] hover:bg-green-500 hover:text-black transition-all"
                                   >Affirm</button>
                                   <button 
                                      onClick={() => handleVoteAction(inspectedProposal.id, 'AGAINST')}
                                      className="flex-1 py-8 bg-red-600/10 text-red-500 border border-red-500/20 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] hover:bg-red-500 hover:text-black transition-all"
                                   >Reject</button>
                                </div>
                             </div>
                          ) : (
                             <div className="space-y-6">
                                <button 
                                   onClick={() => { onExecute(inspectedProposal.id); setInspectedProposal(null); }}
                                   disabled={inspectedProposal.status !== 'PASSED'}
                                   className={`w-full py-8 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] transition-all ${
                                      inspectedProposal.status === 'PASSED' ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-2xl' : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                                   }`}
                                >
                                   {inspectedProposal.status === 'EXECUTING' ? 'INITIATIVE LIVE' : 'Commit Final Execution'}
                                </button>
                                <button 
                                   onClick={() => { onJoin(inspectedProposal.id); setInspectedProposal(null); }}
                                   disabled={inspectedProposal.status !== 'PASSED' && inspectedProposal.status !== 'EXECUTING'}
                                   className={`w-full py-8 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] transition-all ${
                                      (inspectedProposal.status === 'PASSED' || inspectedProposal.status === 'EXECUTING') ? 'bg-orange-500 text-black hover:bg-orange-400 shadow-2xl' : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                                   }`}
                                >
                                   Assign To Resolution Group
                                </button>
                             </div>
                          )}
                       </div>

                       <div className="bg-purple-500/5 p-8 rounded-[2.5rem] border border-purple-500/10">
                          <p className="text-[10px] text-gray-500 italic uppercase leading-relaxed text-center font-medium">
                            "By affirming this initiative, you are directing the Sovereign Lattice's neural compute resources toward this specific scientific horizon."
                          </p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-black/60 border-t border-white/5 flex justify-center shrink-0">
                 <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.5em]">SOVEREIGN COUNCIL INSPECTION MODULE // SHARD PROOF: {inspectedProposal.id}</p>
              </div>
           </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="bg-zinc-900 border border-purple-500/30 p-12 rounded-[4rem] w-full max-w-2xl flex flex-col shadow-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
              
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <span className="text-[10px] text-purple-500 font-black uppercase tracking-[0.4em] block mb-2">Universal Registry Update</span>
                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter font-serif">New Initiative</h3>
                 </div>
                 <button onClick={() => setShowCreateModal(false)} className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white text-3xl font-bold transition-all hover:bg-white/10">×</button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-8">
                 <div className="space-y-4">
                    <input 
                      type="text" required placeholder="Initiative Designation..."
                      value={newTitle} onChange={e => setNewTitle(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-sm text-white outline-none focus:border-purple-500 font-medium italic"
                    />
                    <textarea 
                      required placeholder="Technical Abstract..."
                      value={newDesc} onChange={e => setNewDesc(e.target.value)}
                      className="w-full h-32 bg-black/60 border border-white/10 rounded-2xl p-5 text-sm text-gray-300 outline-none focus:border-purple-500 resize-none custom-scrollbar"
                    />
                    <div className="grid grid-cols-3 gap-4">
                       {(['SCIENTIFIC', 'ECONOMIC', 'SECURITY'] as const).map(cat => (
                         <button key={cat} type="button" onClick={() => setNewCategory(cat)} className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${newCategory === cat ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-gray-600 border-white/5 hover:border-white/10'}`}>{cat}</button>
                       ))}
                    </div>
                 </div>

                 <div className="bg-purple-500/5 p-6 rounded-[2rem] border border-purple-500/10 text-center">
                    <p className="text-[10px] text-gray-400 font-medium uppercase leading-relaxed">
                       A fee of <span className="text-white font-black">500 QRK</span> will be deducted to broadcast this poll. Proposers earn <span className="text-purple-400 font-black">1% commission</span> on total stakes if passed.
                    </p>
                 </div>

                 <button type="submit" className="w-full py-6 bg-purple-600 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] hover:bg-purple-500 shadow-2xl active:scale-95 transition-all">Commit Broadcast</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default GovernanceView;
