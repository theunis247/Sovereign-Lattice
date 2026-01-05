
import React, { useMemo } from 'react';
import { User } from '../types';
import { ADMIN_ID } from '../services/db';
import { QBS_UNITS, formatCurrency } from '../services/quantumLogic';

interface TokenomicsViewProps {
  user: User;
  allUsers: User[];
}

const TokenomicsView: React.FC<TokenomicsViewProps> = ({ user, allUsers }) => {
  const tokenStats = useMemo(() => {
    const MAX_SUPPLY_QBS = QBS_UNITS.TOTAL_MAX_QBS; // 10,000

    let founderReserveBalance = 0;
    let totalMinedPublic = 0;

    allUsers.forEach(u => {
      if (u.address === ADMIN_ID) {
        founderReserveBalance = u.balance;
      } else {
        totalMinedPublic += u.balance;
      }
    });

    const circulating = totalMinedPublic + founderReserveBalance;
    const remainingDiscovery = Math.max(0, 9000 - totalMinedPublic); 

    const founderPct = (founderReserveBalance / MAX_SUPPLY_QBS) * 100;
    const publicMinedPct = (totalMinedPublic / MAX_SUPPLY_QBS) * 100;

    return {
      MAX_SUPPLY_QBS,
      userBalance: user.balance,
      founderReserveBalance,
      remainingDiscovery,
      circulating,
      founderPct,
      publicMinedPct,
      totalQuarksMined: Math.round(circulating * QBS_UNITS.QRK),
      activeTokenIndex: Math.floor(circulating) + 1
    };
  }, [allUsers, user.balance, user.address]);

  return (
    <div className="flex-1 flex flex-col gap-12 animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto custom-scrollbar p-2 pb-32">
      
      {/* Hero Section: Market Cap & Cap Status */}
      <div className="bg-zinc-900/60 border border-white/5 p-10 rounded-[4rem] relative overflow-hidden shrink-0 shadow-2xl">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(247,147,26,0.08),transparent_60%)]"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] text-green-500 font-black uppercase tracking-[0.5em]">The 10,000 Breakthrough Sovereign Cap</span>
            </div>
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">
              Universal Shard <br/> Economic Model
            </h2>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-widest italic">Fixed Ecosystem: 1,000 Founder Reserve // 9,000 Public Pool</p>
          </div>

          <div className="flex flex-col items-end justify-center">
            <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-2">Total System Valuation</span>
            <div className="text-6xl font-black text-white mono leading-none tracking-tighter">
              {formatCurrency(tokenStats.MAX_SUPPLY_QBS)}
            </div>
            <span className="text-xs text-orange-500 font-black mt-2 uppercase">Limit: {QBS_UNITS.TOTAL_MAX_QRK.toLocaleString()} Sovereign Quarks</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 border-t border-white/5 pt-10">
          <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
            <span className="block text-[8px] text-gray-600 font-black uppercase mb-1">Your Resolved Magnitude</span>
            <span className="text-xl font-black text-white">{tokenStats.userBalance.toFixed(6)} <span className="text-[10px] text-gray-600 uppercase">QBS</span></span>
          </div>
          <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
            <span className="block text-[8px] text-gray-600 font-black uppercase mb-1">Total Public Discovery</span>
            <span className="text-xl font-black text-blue-400">{(9000 - tokenStats.remainingDiscovery).toFixed(3)} <span className="text-[10px] text-gray-600 uppercase">QBS</span></span>
          </div>
          <div className="bg-black/20 p-6 rounded-3xl border border-orange-500/10">
            <span className="block text-[8px] text-orange-500 font-black uppercase mb-1">Remaining Discovery Pool</span>
            <span className="text-xl font-black text-orange-500">{tokenStats.remainingDiscovery.toFixed(3)} <span className="text-[10px] text-orange-500 uppercase">QBS</span></span>
          </div>
          <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
            <span className="block text-[8px] text-gray-600 font-black uppercase mb-1">Founder Genesis Block</span>
            <span className="text-xl font-black text-white">{tokenStats.founderReserveBalance.toFixed(2)} <span className="text-[10px] text-gray-600 uppercase">QBS</span></span>
          </div>
        </div>
      </div>

      {/* NEW SECTION: Layman's Guide to Scalar Economics */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
           <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Understanding the Scalar Lattice</h3>
           <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em]">From Micro-Pulses to Macro-Breakthroughs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
           {/* QBS Card */}
           <div className="bg-gradient-to-b from-orange-500/10 to-transparent border border-orange-500/30 p-8 rounded-[3rem] space-y-6 relative group overflow-hidden shadow-2xl">
              <div className="absolute top-4 right-6 text-4xl opacity-10 font-black italic">MACRO</div>
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(247,147,26,0.4)]">
                 <span className="text-3xl font-black text-black italic">₿</span>
              </div>
              <div className="space-y-2">
                 <h4 className="text-xl font-black text-white uppercase tracking-tight">QBS Master Token</h4>
                 <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                   The <span className="text-orange-500 font-black">Gold Standard</span> of the Lattice. Only 10,000 exist. Each QBS is an NFT representing a completed scientific breakthrough. It is the highest form of magnitude.
                 </p>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-[10px] font-black text-center text-gray-500 uppercase tracking-widest">
                 1 QBS = 1,000 Shards
              </div>
           </div>

           {/* Shard Card */}
           <div className="bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/30 p-8 rounded-[3rem] space-y-6 relative group overflow-hidden shadow-2xl">
              <div className="absolute top-4 right-6 text-4xl opacity-10 font-black italic">MESO</div>
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                 <span className="text-3xl font-black text-black italic">Σ</span>
              </div>
              <div className="space-y-2">
                 <h4 className="text-xl font-black text-white uppercase tracking-tight">Discovery Shard</h4>
                 <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                   The <span className="text-blue-500 font-black">Work Unit</span>. This is what you "mine" by resolving universal problems. It takes 1,000 Shards of effort to forge a single QBS Breakthrough Token.
                 </p>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-[10px] font-black text-center text-gray-500 uppercase tracking-widest">
                 1 Shard = 1,000,000 Quarks
              </div>
           </div>

           {/* Quark Card */}
           <div className="bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-500/30 p-8 rounded-[3rem] space-y-6 relative group overflow-hidden shadow-2xl">
              <div className="absolute top-4 right-6 text-4xl opacity-10 font-black italic">MICRO</div>
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                 <span className="text-3xl font-black text-black italic">q</span>
              </div>
              <div className="space-y-2">
                 <h4 className="text-xl font-black text-white uppercase tracking-tight">Sovereign Quark</h4>
                 <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                   The <span className="text-purple-500 font-black">Base Currency</span>. 1 Quark is pegged to $1.00 USD. Use these to send secure messages, pay for node subscriptions, or trade in the Market.
                 </p>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-[10px] font-black text-center text-gray-500 uppercase tracking-widest">
                 1 Quark = $1.00 USD
              </div>
           </div>
        </div>
      </section>

      {/* Discovery Spectrum Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 shrink-0">
        <div className="lg:col-span-8 bg-zinc-900/40 border border-white/5 p-12 rounded-[4rem] relative overflow-hidden group shadow-2xl">
          <h3 className="text-lg font-black text-white uppercase tracking-tighter italic mb-12 border-l-4 border-orange-500 pl-6">Global Discovery Spectrum</h3>
          
          <div className="space-y-16">
            <div className="space-y-6">
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2">
                 <span className="text-gray-500">Master Token Resolution Index</span>
                 <span className="text-orange-500">Current Frontier: Breakthrough #{tokenStats.activeTokenIndex}</span>
               </div>
               <div className="h-24 bg-black/60 rounded-[2.5rem] border border-white/5 p-2 flex gap-1.5 overflow-hidden shadow-inner">
                 <div className="h-full bg-orange-500 rounded-3xl flex items-center justify-center transition-all duration-700 min-w-[80px] shadow-[0_0_20px_rgba(247,147,26,0.3)]" style={{ width: `${Math.max(tokenStats.founderPct, 2)}%` }}>
                   <span className="text-[10px] text-black font-black uppercase">GENESIS</span>
                 </div>
                 {tokenStats.publicMinedPct > 0.01 && (
                   <div className="h-full bg-blue-500 rounded-3xl flex items-center justify-center transition-all duration-700 shadow-[0_0_20px_rgba(59,130,246,0.3)]" style={{ width: `${tokenStats.publicMinedPct}%` }}>
                     <span className="text-[10px] text-white font-black uppercase">NODES</span>
                   </div>
                 )}
                 <div className="h-full bg-zinc-800/20 border border-dashed border-white/10 rounded-3xl flex items-center justify-center transition-all duration-700 relative flex-1">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.05),transparent_70%)] animate-pulse"></div>
                   <span className="text-[10px] text-gray-700 font-black uppercase tracking-[0.2em] italic z-10">{tokenStats.remainingDiscovery.toFixed(3)} QBS Available</span>
                 </div>
               </div>
            </div>

            <div className="bg-orange-500/5 p-10 rounded-[3rem] border border-orange-500/10 text-center">
              <p className="text-xs text-gray-400 leading-relaxed font-serif italic max-w-2xl mx-auto uppercase tracking-widest">
                "As the public pool empties, the scarcity of scientific truth increases. Once 10,000 breakthroughs are resolved, the Lattice reaches total equilibrium."
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-zinc-900/40 border border-orange-500/10 p-10 rounded-[4rem] flex flex-col justify-between shadow-2xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.04),transparent_70%)] group-hover:scale-150 transition-transform duration-1000"></div>
           <div className="relative z-10">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-10">Economic Pulse</h3>
              <div className="space-y-10">
                 <div className="bg-black/60 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                    <span className="block text-[8px] text-gray-600 font-black uppercase mb-2">Total Shards Mined</span>
                    <span className="text-4xl font-black text-white block">
                      {(tokenStats.circulating * 1000).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-green-400 font-black uppercase tracking-widest mt-2 block">Resolution Fragments Active</span>
                 </div>
                 <div className="bg-black/60 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                    <span className="block text-[8px] text-gray-600 font-black uppercase mb-2">Quark Circulating Supply</span>
                    <span className="text-xl font-black text-orange-500 block uppercase">
                      {tokenStats.totalQuarksMined.toLocaleString()} QRK
                    </span>
                    <p className="text-[7px] text-gray-700 mt-2 font-black uppercase">Pegged at $1.00 USD / Quark</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TokenomicsView;
