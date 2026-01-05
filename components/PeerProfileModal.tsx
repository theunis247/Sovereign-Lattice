
import React from 'react';
// Fix: Import User from ../types instead of ../services/quantumLogic
import { QBS_UNITS } from '../services/quantumLogic';
import { User, SolvedBlock } from '../types';

interface PeerProfileModalProps {
  peer: User;
  onClose: () => void;
}

const PeerProfileModal: React.FC<PeerProfileModalProps> = ({ peer, onClose }) => {
  const getAvatarGradient = (addr: string) => {
    const colors = ['#f7931a', '#3b82f6', '#a855f7', '#10b981', '#ef4444'];
    const idx1 = addr.charCodeAt(0) % colors.length;
    const idx2 = addr.charCodeAt(addr.length - 1) % colors.length;
    return `linear-gradient(135deg, ${colors[idx1]} 0%, ${colors[idx2]} 100%)`;
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 md:p-12 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500">
      <div className="bg-zinc-900 border border-white/10 rounded-[4rem] w-full max-w-4xl h-[85vh] flex flex-col shadow-3xl relative overflow-hidden">
        
        {/* Background Aura */}
        <div 
          className="absolute top-0 left-0 w-full h-64 opacity-20 pointer-events-none blur-3xl"
          style={{ background: getAvatarGradient(peer.address) }}
        ></div>

        {/* Header */}
        <div className="p-12 border-b border-white/5 flex justify-between items-start relative z-10">
          <div className="flex items-center gap-8">
             <div 
                className="w-32 h-32 rounded-full border-8 border-black flex items-center justify-center text-4xl font-black text-white shadow-2xl"
                style={{ background: getAvatarGradient(peer.address) }}
             >
                {peer.username.charAt(0).toUpperCase()}
             </div>
             <div>
                <div className="flex items-center gap-4">
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{peer.username}</h2>
                  <span className="text-lg font-black text-orange-500 mono bg-black/40 px-3 py-1 rounded-xl border border-orange-500/20">{peer.profileId}</span>
                </div>
                <p className="text-orange-500 text-xs font-black uppercase tracking-[0.4em] mt-2">{peer.tagline || 'Sovereign Lattice Observer'}</p>
                <div className="flex gap-4 mt-6">
                   <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Tier: {peer.role}</span>
                   </div>
                   <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                      <span className="text-[10px] font-black text-blue-400 uppercase">Verified Node</span>
                   </div>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center hover:bg-red-500/20 text-white text-3xl font-bold transition-all">×</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar relative z-10">
           <section className="space-y-4">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-l-2 border-orange-500 pl-4">Observer Mission Statement</h3>
              <p className="text-lg text-gray-400 italic font-medium leading-relaxed bg-black/40 p-8 rounded-[2rem] border border-white/5">
                "{peer.bio || 'This observer has not yet transmitted a mission statement to the public registry.'}"
              </p>
           </section>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <section className="space-y-6">
                 <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Inventory Visualization</h3>
                 <div className="space-y-4">
                    <div className="bg-black/60 p-6 rounded-3xl border border-white/5 flex justify-between items-center">
                       <span className="text-[9px] font-black text-gray-600 uppercase">QBS Tokens</span>
                       <span className="text-xl font-black text-orange-500">{peer.balance.toFixed(6)}</span>
                    </div>
                    <div className="bg-black/60 p-6 rounded-3xl border border-white/5 flex justify-between items-center">
                       <span className="text-[9px] font-black text-gray-600 uppercase">Work Shards</span>
                       <span className="text-xl font-black text-blue-400">{Math.floor(peer.balance * 1000).toLocaleString()}</span>
                    </div>
                    <div className="bg-black/60 p-6 rounded-3xl border border-white/5 flex justify-between items-center">
                       <span className="text-[9px] font-black text-gray-600 uppercase">Quarks</span>
                       <span className="text-xl font-black text-purple-400">{Math.floor(peer.balance * 1000000000).toLocaleString()}</span>
                    </div>
                 </div>
              </section>

              <section className="space-y-6">
                 <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Scientific Accomplishments</h3>
                 <div className="grid grid-cols-2 gap-3">
                    {peer.milestones?.length ? peer.milestones.map(m => (
                      <div key={m.id} className="bg-black/60 p-4 rounded-2xl border border-white/5 text-center space-y-2 group hover:border-purple-500/30 transition-all">
                         <div className="text-2xl grayscale group-hover:grayscale-0">{m.icon}</div>
                         <h4 className="text-[8px] font-black text-white uppercase tracking-tighter">{m.title}</h4>
                      </div>
                    )) : (
                      <div className="col-span-2 py-10 border border-dashed border-white/5 rounded-3xl flex items-center justify-center opacity-30">
                        <span className="text-[10px] font-black uppercase tracking-widest">No milestones archived</span>
                      </div>
                    )}
                 </div>
              </section>
           </div>

           <section className="space-y-6">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Archived Breakthroughs</h3>
              <div className="space-y-4">
                 {peer.solvedBlocks?.length ? peer.solvedBlocks.map((b, i) => (
                   <div key={i} className="bg-black/40 p-6 rounded-2xl border border-white/5 flex justify-between items-center">
                      <div>
                        <span className="text-[8px] text-blue-400 font-black uppercase mb-1 block">Breakthrough #{b.shardIndex}</span>
                        <h4 className="text-sm font-black text-white uppercase truncate max-w-md">{b.problem.split('.')[0]}</h4>
                      </div>
                      <div className="text-right">
                         <span className="text-[8px] text-orange-500 font-black uppercase block">Magnitude Yield</span>
                         <span className="text-xs font-black text-white mono">{b.reward.toFixed(3)} QBS</span>
                      </div>
                   </div>
                 )) : (
                   <div className="py-10 text-center opacity-20 border border-dashed border-white/5 rounded-3xl">
                      <p className="text-[10px] font-black uppercase tracking-widest">No scientific resolutions recorded</p>
                   </div>
                 )}
              </div>
           </section>
        </div>

        <div className="p-8 bg-black/40 border-t border-white/5 text-center">
           <p className="text-[8px] text-gray-700 font-black uppercase tracking-[0.4em]">Public Record // ID: {peer.address.substring(0, 16).toUpperCase()}...</p>
        </div>
      </div>
    </div>
  );
};

export default PeerProfileModal;
