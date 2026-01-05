
import React, { useMemo, useState } from 'react';
import { User, Transaction, SolvedBlock } from '../types';
import { QBS_UNITS } from '../services/quantumLogic';
import TokenTransfer from './TokenTransfer';
import TransactionHistory from './TransactionHistory';

interface WalletViewProps {
  user: User;
  onSubscribe: (type: 'MESSAGING' | 'MINING') => void;
  onTransfer: (toPub: string, amount: number, privKey: string, unit: Transaction['unit']) => void;
}

const WalletView: React.FC<WalletViewProps> = ({ user, onSubscribe, onTransfer }) => {
  const [showPrivate, setShowPrivate] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'transfer' | 'blockchain' | 'inventory' | 'nfts'>('transfer');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferPriv, setTransferPriv] = useState('');
  const [transferUnit, setTransferUnit] = useState<Transaction['unit']>('QRK');

  const totalQuarksMagnitude = Math.round(user.balance * QBS_UNITS.QRK);
  
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!transferTarget || isNaN(amt) || amt <= 0 || !transferPriv) return;
    onTransfer(transferTarget, amt, transferPriv, transferUnit);
    setTransferAmount('');
    setTransferTarget('');
    setTransferPriv('');
  };

  const shardsTowardNext = user.shardsTowardNextQBS || 0;
  const nftCount = user.ownedNfts?.length || 0;

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0 h-full overflow-hidden">
        
        <div className="lg:col-span-7 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
          {/* Economic Hub Card */}
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-orange-500/30 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                 <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em]">Node Economic Portfolio</h3>
                 <span className="px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 text-[8px] font-black text-green-500 uppercase">Registry Verified</span>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="space-y-1">
                   <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">Operational Liquidity</span>
                   <div className="flex items-center gap-4">
                      <span className="text-5xl font-black text-white mono">${user.usdBalance.toLocaleString()}</span>
                      <span className="text-xl text-purple-400 font-black uppercase tracking-tighter">QRK</span>
                   </div>
                </div>

                <div className="h-px bg-white/5 w-full"></div>

                <div className="space-y-1">
                   <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">Ascended Magnitude</span>
                   <div className="flex items-center gap-4">
                      <span className="text-4xl font-black text-orange-500 mono leading-none tracking-tighter">
                        {user.balance.toFixed(6)} <span className="text-lg tracking-widest uppercase">QBS</span>
                      </span>
                   </div>
                   <p className="text-[7px] text-gray-600 font-bold uppercase mt-1 tracking-widest">({totalQuarksMagnitude.toLocaleString()} Shard-equivalent power)</p>
                </div>
              </div>

              {/* Shard Progress Indicator */}
              <div className="mt-10 bg-black/40 p-6 rounded-3xl border border-white/5">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Consolidation To Breakthrough</span>
                    <span className="text-[10px] text-white font-bold mono">{shardsTowardNext} / {QBS_UNITS.SHD} SHD</span>
                 </div>
                 <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 shadow-[0_0_15px_#3b82f6]" style={{ width: `${(shardsTowardNext / QBS_UNITS.SHD) * 100}%` }}></div>
                 </div>
                 <p className="text-[7px] text-gray-600 font-bold uppercase mt-2 tracking-widest">Scientific work resolves into shards. 1,000 shards forge a Master Breakthrough.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between">
                <div>
                   <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Messaging Service</h4>
                   <div className="flex items-center gap-3 mb-6">
                      <div className={`w-3 h-3 rounded-full ${user.messagingActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      <span className={`text-xs font-black uppercase tracking-widest ${user.messagingActive ? 'text-green-500' : 'text-red-500'}`}>
                         {user.messagingActive ? 'Tunnel Active' : 'Tunnel Locked'}
                      </span>
                   </div>
                </div>
                <button 
                  onClick={() => onSubscribe('MESSAGING')}
                  className="w-full py-4 bg-white/5 hover:bg-orange-500 hover:text-black border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                >
                   Renew Lease ($1)
                </button>
             </div>

             <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between">
                <div>
                   <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Mining Access</h4>
                   <div className="flex items-center gap-3 mb-6">
                      <div className={`w-3 h-3 rounded-full ${user.miningActive ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></div>
                      <span className={`text-xs font-black uppercase tracking-widest ${user.miningActive ? 'text-blue-400' : 'text-red-500'}`}>
                         {user.miningActive ? 'Miner Synced' : 'Miner Offline'}
                      </span>
                   </div>
                </div>
                <button 
                  onClick={() => onSubscribe('MINING')}
                  className="w-full py-4 bg-white/5 hover:bg-blue-500 hover:text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                >
                   Renew Miner ($50)
                </button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col bg-zinc-900/60 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="flex border-b border-white/5 shrink-0">
             <button 
               onClick={() => setActiveSubTab('transfer')}
               className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'transfer' ? 'text-orange-500 bg-orange-500/5' : 'text-gray-500 hover:text-white'}`}
             >
               Local Transfer
             </button>
             <button 
               onClick={() => setActiveSubTab('blockchain')}
               className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'blockchain' ? 'text-blue-500 bg-blue-500/5' : 'text-gray-500 hover:text-white'}`}
             >
               Blockchain
             </button>
             <button 
               onClick={() => setActiveSubTab('nfts')}
               className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'nfts' ? 'text-purple-500 bg-purple-500/5' : 'text-gray-500 hover:text-white'}`}
             >
               Archive ({nftCount})
             </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {activeSubTab === 'transfer' ? (
              <form onSubmit={handleTransferSubmit} className="flex flex-col gap-6 h-full animate-in fade-in duration-300">
                <div className="space-y-4">
                  <div>
                    <label className="text-[8px] text-gray-600 font-black uppercase tracking-widest block mb-2">Target Bech32m Address</label>
                    <input 
                      type="text" 
                      value={transferTarget}
                      onChange={e => setTransferTarget(e.target.value)}
                      placeholder="qbs1-..."
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-xs mono text-blue-300 outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] text-gray-600 font-black uppercase tracking-widest block mb-2">Quantity</label>
                      <input 
                        type="number" 
                        value={transferAmount}
                        onChange={e => setTransferAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-gray-600 font-black uppercase tracking-widest block mb-2">Economic Unit</label>
                      <select 
                        value={transferUnit}
                        onChange={e => setTransferUnit(e.target.value as Transaction['unit'])}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-orange-500 font-black outline-none"
                      >
                        <option value="QRK">Quark ($)</option>
                        <option value="QBS">Master (Prestige)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-600 font-black uppercase tracking-widest block mb-2">Master Authorization Secret</label>
                    <input 
                      type="password" 
                      value={transferPriv}
                      onChange={e => setTransferPriv(e.target.value)}
                      placeholder="LATTICE-PRV-..."
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-red-400 mono outline-none"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="mt-auto w-full py-5 bg-orange-500 text-black rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] hover:bg-orange-400 active:scale-95 transition-all"
                >
                  Broadcast Transfer Shard
                </button>
              </form>
            ) : activeSubTab === 'blockchain' ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">QBS Token Transfer</h4>
                  <TokenTransfer 
                    onTransferComplete={(hash, success) => {
                      if (success) {
                        // Could add notification here
                        console.log('Transfer completed:', hash);
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Blockchain History</h4>
                  <TransactionHistory maxTransactions={20} showFilters={true} />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                {user.ownedNfts?.length === 0 ? (
                  <div className="text-center py-20 opacity-30">
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">No scientific certifications discovered.</p>
                  </div>
                ) : (
                  user.ownedNfts?.map((nft) => (
                    <div key={nft.tokenId} className="bg-gradient-to-r from-purple-900/20 to-black border border-purple-500/30 p-6 rounded-[2rem] relative group overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                          <span className="text-6xl italic font-black text-purple-500">QBS</span>
                       </div>
                       <div className="relative z-10">
                          <div className="flex justify-between items-center mb-3">
                             <span className="px-2 py-0.5 bg-purple-500/20 rounded border border-purple-500/30 text-[8px] font-black text-purple-400 uppercase">Asset #{nft.tokenId}</span>
                             <span className="text-[8px] text-gray-500 font-bold uppercase">{nft.domain}</span>
                          </div>
                          <h5 className="text-md font-black text-white uppercase tracking-tight leading-tight mb-2">{nft.title}</h5>
                       </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletView;
