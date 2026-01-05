
import React from 'react';
import { Transaction } from '../types';

interface LedgerPanelProps {
  transactions: Transaction[];
}

const LedgerPanel: React.FC<LedgerPanelProps> = ({ transactions }) => {
  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sovereign Shard Ledger</h3>
        <span className="text-[8px] text-orange-500 font-bold px-2 py-0.5 rounded border border-orange-500/20 uppercase">Global Sync</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center opacity-40">
            <div className="text-2xl mb-2">∅</div>
            <p className="text-[10px] uppercase font-bold tracking-widest leading-relaxed">No magnitude movement detected.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {[...transactions].reverse().map((tx) => (
              <div key={tx.id} className="p-4 hover:bg-white/[0.02] transition-colors group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-tight ${
                      tx.type === 'CREDIT' || tx.type === 'TRANSFER_IN' ? 'text-green-500' : 'text-red-400'
                    }`}>
                      {tx.type.replace('_', ' ')} // {tx.description}
                    </span>
                    <span className="text-[8px] text-gray-600 mono mt-1">{tx.timestamp}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[12px] font-black mono ${
                      tx.type === 'CREDIT' || tx.type === 'TRANSFER_IN' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'CREDIT' || tx.type === 'TRANSFER_IN' ? '+' : '-'}{parseFloat(tx.amount).toLocaleString()} {tx.unit}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 bg-black/40 p-3 rounded-xl border border-white/5 group-hover:border-orange-500/20 transition-all">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[7px] mono">
                      <span className="text-gray-600 uppercase font-black">Source Shard:</span>
                      <span className="text-blue-300 truncate ml-4">{tx.from || 'LATTICE_NATIVE'}</span>
                    </div>
                    <div className="flex justify-between text-[7px] mono">
                      <span className="text-gray-600 uppercase font-black">Target Shard:</span>
                      <span className="text-blue-300 truncate ml-4">{tx.to || 'LOCAL_VAULT'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-[7px] text-gray-700 mono truncate opacity-50 group-hover:opacity-100 transition-opacity flex justify-between">
                  <span>TXID: {tx.id}</span>
                  <span>CONSENSUS_VERIFIED</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LedgerPanel;
