
import React, { useState } from 'react';
import { User, SolvedBlock } from '../types';

interface AdminDatabaseViewProps {
  users: User[];
}

const AdminDatabaseView: React.FC<AdminDatabaseViewProps> = ({ users }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<SolvedBlock | null>(null);

  const totalMarketCap = users.reduce((sum, u) => sum + u.balance, 0) * 1000000000;
  
  const allGlobalBlocks = users.flatMap(u => 
    (u.solvedBlocks || []).map(b => ({ ...b, username: u.username, userAddress: u.address }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
      <div className="flex justify-between items-center bg-zinc-900 border border-orange-500/20 p-6 rounded-[2rem] shrink-0 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            Quantum Sovereign Registry
            <span className="bg-orange-500 text-black text-[8px] px-2 py-0.5 rounded font-black">ENCRYPTED_AT_REST</span>
          </h2>
          <p className="text-[10px] text-gray-500 font-bold tracking-[0.3em] uppercase mt-1">Lattice Persistence Layer :: Integrity Verified</p>
        </div>
        <div className="flex gap-8 relative z-10">
          <div className="text-center">
            <span className="block text-[8px] text-gray-500 font-black uppercase">Nodes</span>
            <span className="text-lg font-black text-white">{users.length}</span>
          </div>
          <div className="text-center">
            <span className="block text-[8px] text-gray-500 font-black uppercase">Market Magnitude</span>
            <span className="text-lg font-black text-orange-500">${totalMarketCap.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        <div className="lg:col-span-12 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
             <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Global Shard Ledger</h3>
             <span className="text-[7px] text-orange-500/50 font-black uppercase animate-pulse">Scanning Active Channels...</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-900 z-10">
                <tr className="border-b border-white/5">
                  <th className="p-4 text-[9px] text-gray-500 uppercase font-black">Shard / Tier</th>
                  <th className="p-4 text-[9px] text-gray-500 uppercase font-black">Proving Node</th>
                  <th className="p-4 text-[9px] text-gray-500 uppercase font-black">Unit Status</th>
                  <th className="p-4 text-[9px] text-gray-500 uppercase font-black text-right">Magnitude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allGlobalBlocks.map((block) => (
                  <tr key={block.id} onClick={() => setSelectedBlock(block)} className="hover:bg-orange-500/5 cursor-pointer transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-orange-400 mono">{block.shardId}</span>
                        <span className="text-[7px] text-gray-600 uppercase font-bold tracking-widest">Mk {block.advancementLevel || 1} // {block.timestamp}</span>
                      </div>
                    </td>
                    <td className="p-4"><span className="text-[10px] text-white font-bold group-hover:text-orange-400 uppercase">{block.username}</span></td>
                    <td className="p-4"><span className="text-[8px] text-green-500 font-black uppercase">VALIDATED</span></td>
                    <td className="p-4 text-right"><span className="text-[10px] text-white font-black">{block.payoutPerShard}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedBlock && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-orange-500/30 rounded-[3rem] p-10 max-w-2xl w-full flex flex-col shadow-3xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.3em]">Master Registry Inspection</span>
                <h2 className="text-2xl font-black text-white uppercase mt-1">Shard: {selectedBlock.shardId}</h2>
              </div>
              <button onClick={() => setSelectedBlock(null)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white text-xl font-bold">×</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar">
              <section className="space-y-3">
                <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest border-l-2 border-orange-500 pl-3">Theoretical Resolution</h4>
                <div className="bg-black/60 p-6 rounded-2xl border border-white/5 text-sm text-gray-300 mono leading-relaxed italic">"{selectedBlock.problem}"</div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDatabaseView;
