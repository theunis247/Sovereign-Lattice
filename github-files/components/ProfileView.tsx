
import React, { useState, useMemo } from 'react';
import { User, Milestone } from '../types';
import { QBS_UNITS } from '../services/quantumLogic';
import LatticeLogo from './LatticeLogo';

interface ProfileViewProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdate }) => {
  const [tagline, setTagline] = useState(user.tagline || '');
  const [bio, setBio] = useState(user.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Operational Quarks are stored in usdBalance
  const operationalQuarks = user.usdBalance; 
  const currentMagnitudeQBS = user.balance;

  const handleSave = async () => {
    setIsSaving(true);
    const updatedUser = { ...user, tagline, bio };
    await onUpdate(updatedUser);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.profileId);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const getXpForLevel = (level: number) => Math.pow(level - 1, 2) * 500;
  
  const xpProgress = useMemo(() => {
    const base = getXpForLevel(user.level);
    const next = getXpForLevel(user.level + 1);
    const progress = user.xp - base;
    const total = next - base;
    return (progress / total) * 100;
  }, [user.xp, user.level]);

  return (
    <div className="flex-1 flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto custom-scrollbar p-2 pb-32 max-w-5xl mx-auto w-full">
      
      {/* Profile Header / Identity Card */}
      <div className="bg-zinc-900 border border-white/10 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#f7931a 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
           <div className="relative group">
              <div className="w-40 h-40 rounded-[2.5rem] bg-zinc-950 border-4 border-white/5 flex items-center justify-center overflow-hidden shadow-3xl">
                 <LatticeLogo size="massive" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-orange-500 text-black px-4 py-1 rounded-full text-[12px] font-black uppercase border-4 border-black shadow-xl">
                 LVL {user.level}
              </div>
           </div>

           <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-1">
                 <div className="flex items-center gap-4 justify-center md:justify-start">
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{user.username}</h2>
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 text-[10px] font-black uppercase tracking-widest">
                       {user.role} Node
                    </span>
                 </div>
                 <div className="flex items-center gap-2 justify-center md:justify-start">
                   <button 
                    onClick={handleCopyId}
                    className="bg-black/40 hover:bg-black/60 px-4 py-1.5 rounded-xl border border-white/5 flex items-center gap-2 transition-all group/id"
                   >
                     <span className="text-[11px] font-black text-orange-500 mono tracking-widest">{user.profileId}</span>
                     <span className="text-[8px] text-gray-500 font-bold uppercase group-hover/id:text-white transition-colors">{copyFeedback ? 'COPIED!' : 'COPY ID'}</span>
                   </button>
                 </div>
              </div>
              <input 
                type="text" 
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="Observer mission tagline..."
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-gray-300 italic outline-none focus:border-orange-500/50"
              />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-7 space-y-8">
            <section className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3rem] space-y-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <span className="text-8xl font-black italic">XP</span>
               </div>
               <div className="flex justify-between items-end relative z-10">
                  <div className="space-y-1">
                     <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">Lattice Synchronization XP</h3>
                     <p className="text-2xl font-black text-white">Level {user.level}</p>
                  </div>
                  <div className="text-right">
                     <span className="text-xs font-black text-gray-500 mono">{user.xp} / {getXpForLevel(user.level + 1)} XP</span>
                  </div>
               </div>
               
               <div className="relative h-4 bg-black/60 rounded-full border border-white/5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-1000"
                    style={{ width: `${xpProgress}%` }}
                  >
                     <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-scan_2s_linear_infinite]"></div>
                  </div>
               </div>
            </section>

            <section className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3rem] space-y-6 shadow-xl">
               <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-l-2 border-orange-500 pl-4">Node Bio</h3>
               <textarea 
                 value={bio}
                 onChange={e => setBio(e.target.value)}
                 className="w-full h-40 bg-black/60 border border-white/5 rounded-[2rem] p-8 text-sm text-gray-400 outline-none focus:border-orange-500/50 resize-none custom-scrollbar"
               />
               <button 
                 onClick={handleSave}
                 disabled={isSaving}
                 className="w-full py-4 bg-orange-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-orange-400 active:scale-95 transition-all"
               >
                 {isSaving ? 'SYNCING...' : 'SAVE PROFILE'}
               </button>
            </section>
         </div>

         <div className="lg:col-span-5 space-y-8">
            <section className="bg-gradient-to-b from-zinc-800 to-black border border-white/10 p-10 rounded-[4rem] shadow-2xl space-y-10 relative overflow-hidden">
               <h3 className="text-center text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Scientific Magnitude Ledger</h3>
               
               <div className="space-y-6">
                  {/* Resolved Magnitude (QBS) */}
                  <div className="flex justify-between items-center bg-black/60 p-8 rounded-[2.5rem] border border-orange-500/30 shadow-[0_0_30px_rgba(247,147,26,0.15)] relative overflow-hidden group">
                     <div className="absolute inset-0 bg-orange-500/5 opacity-10"></div>
                     <LatticeLogo size="md" variant="gold" className="relative z-10" />
                     <div className="text-right relative z-10">
                        <span className="block text-[9px] text-orange-400 font-black uppercase tracking-widest">Resolved Magnitude</span>
                        <span className="text-3xl font-black text-white">{currentMagnitudeQBS.toFixed(6)} QBS</span>
                        <p className="text-[7px] text-gray-500 font-bold uppercase mt-1">Reserved for Universal Breakthroughs</p>
                     </div>
                  </div>

                  {/* Operational Quarks (USD Balance) - The primary reward */}
                  <div className="flex justify-between items-center bg-black/40 p-8 rounded-[2.5rem] border border-blue-500/20 shadow-xl relative overflow-hidden group">
                     <div className="absolute inset-0 bg-blue-500/5 opacity-10"></div>
                     <span className="text-4xl text-blue-500 italic font-black relative z-10">q</span>
                     <div className="text-right relative z-10">
                        <span className="block text-[9px] text-blue-400 font-black uppercase tracking-widest">Operational Quarks</span>
                        <span className="text-3xl font-black text-white tracking-tighter">${operationalQuarks.toLocaleString()} QRK</span>
                        <p className="text-[7px] text-gray-500 font-bold uppercase mt-1">Primary Shard Resolution Currency</p>
                     </div>
                  </div>
               </div>

               <div className="bg-orange-500/5 p-6 rounded-[2rem] border border-orange-500/10 text-center">
                  <p className="text-[9px] text-gray-500 italic uppercase leading-relaxed font-medium">
                    "QBS is the evidence of the unimaginable. Quarks fuel the daily resolution of universal truth."
                  </p>
               </div>
            </section>

            <section className="bg-zinc-900/40 border border-white/5 p-8 rounded-[3rem] shadow-xl text-center space-y-2">
               <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">Shard Registry Address</span>
               <p className="text-[9px] text-blue-300 mono break-all p-4 bg-black/40 rounded-2xl border border-white/5">{user.address}</p>
            </section>
         </div>
      </div>
      <style>{`
        @keyframes progress-scan {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
      `}</style>
    </div>
  );
};

export default ProfileView;
