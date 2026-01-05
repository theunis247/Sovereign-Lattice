import React, { useState, useEffect } from 'react';
import { qbsContract } from '../services/qbsContract';
import { walletConnector } from '../services/walletConnector';
import { getExplorerUrl } from '../services/networkConfig';

interface BlockchainTransaction {
  hash: string;
  type: 'TRANSFER' | 'MINING_REWARD' | 'EVOLUTION_REWARD' | 'APPROVAL';
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  blockNumber?: number;
  gasUsed?: string;
  status: 'pending' | 'confirmed' | 'failed';
  explorerUrl?: string;
}

interface TransactionHistoryProps {
  maxTransactions?: number;
  showFilters?: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  maxTransactions = 50, 
  showFilters = true 
}) => {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletState, setWalletState] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received' | 'rewards'>('all');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    loadWalletInfo();
    
    const handleWalletChange = (state: any) => {
      setWalletState(state);
      if (state.isConnected && state.address) {
        loadTransactions(state.address, state.chainId);
        startEventListening();
      } else {
        setTransactions([]);
        stopEventListening();
      }
    };

    walletConnector.onStateChange(handleWalletChange);
    return () => {
      walletConnector.removeStateListener(handleWalletChange);
      stopEventListening();
    };
  }, []);

  const loadWalletInfo = async () => {
    const state = await walletConnector.getWalletState();
    setWalletState(state);
    
    if (state.isConnected && state.address) {
      await loadTransactions(state.address, state.chainId);
      startEventListening();
    }
  };

  const loadTransactions = async (address: string, chainId: number) => {
    setLoading(true);
    setError(null);

    try {
      // For now, we'll load from localStorage and combine with any real blockchain data
      // In a full implementation, you'd query blockchain events or use a service like The Graph
      const localTransactions = getLocalTransactions(address);
      
      // Sort by timestamp (newest first)
      const sortedTransactions = localTransactions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxTransactions);

      setTransactions(sortedTransactions);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setError(err.message || 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const getLocalTransactions = (address: string): BlockchainTransaction[] => {
    try {
      const stored = localStorage.getItem(`QBS_TRANSACTIONS_${address}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveLocalTransaction = (transaction: BlockchainTransaction) => {
    if (!walletState?.address) return;
    
    try {
      const existing = getLocalTransactions(walletState.address);
      const updated = [transaction, ...existing].slice(0, maxTransactions);
      localStorage.setItem(`QBS_TRANSACTIONS_${walletState.address}`, JSON.stringify(updated));
      setTransactions(updated);
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  };

  const startEventListening = async () => {
    if (isListening || !walletState?.isConnected) return;
    
    try {
      setIsListening(true);

      // Listen for Transfer events
      qbsContract.onTransfer((from: string, to: string, value: any, event: any) => {
        if (from === walletState.address || to === walletState.address) {
          const transaction: BlockchainTransaction = {
            hash: event.transactionHash,
            type: 'TRANSFER',
            from,
            to,
            amount: (parseFloat(value.toString()) / 1e18).toFixed(6),
            timestamp: Date.now(),
            blockNumber: event.blockNumber,
            status: 'confirmed',
            explorerUrl: walletState.chainId ? getExplorerUrl(walletState.chainId, event.transactionHash) : undefined
          };
          
          saveLocalTransaction(transaction);
        }
      });

      // Listen for Mining Reward events
      qbsContract.onMiningReward((miner: string, amount: any, blockId: string, grade: string, event: any) => {
        if (miner === walletState.address) {
          const transaction: BlockchainTransaction = {
            hash: event.transactionHash,
            type: 'MINING_REWARD',
            from: '0x0000000000000000000000000000000000000000', // Contract
            to: miner,
            amount: (parseFloat(amount.toString()) / 1e18).toFixed(6),
            timestamp: Date.now(),
            blockNumber: event.blockNumber,
            status: 'confirmed',
            explorerUrl: walletState.chainId ? getExplorerUrl(walletState.chainId, event.transactionHash) : undefined
          };
          
          saveLocalTransaction(transaction);
        }
      });

      // Listen for Evolution Reward events
      qbsContract.onEvolutionReward((user: string, amount: any, blockId: string, newLevel: number, event: any) => {
        if (user === walletState.address) {
          const transaction: BlockchainTransaction = {
            hash: event.transactionHash,
            type: 'EVOLUTION_REWARD',
            from: '0x0000000000000000000000000000000000000000', // Contract
            to: user,
            amount: (parseFloat(amount.toString()) / 1e18).toFixed(6),
            timestamp: Date.now(),
            blockNumber: event.blockNumber,
            status: 'confirmed',
            explorerUrl: walletState.chainId ? getExplorerUrl(walletState.chainId, event.transactionHash) : undefined
          };
          
          saveLocalTransaction(transaction);
        }
      });
    } catch (error) {
      console.error('Failed to start event listening:', error);
    }
  };

  const stopEventListening = () => {
    if (isListening) {
      qbsContract.removeAllListeners();
      setIsListening(false);
    }
  };

  const getFilteredTransactions = () => {
    if (!walletState?.address) return transactions;

    switch (filter) {
      case 'sent':
        return transactions.filter(tx => tx.from.toLowerCase() === walletState.address.toLowerCase());
      case 'received':
        return transactions.filter(tx => tx.to.toLowerCase() === walletState.address.toLowerCase());
      case 'rewards':
        return transactions.filter(tx => tx.type === 'MINING_REWARD' || tx.type === 'EVOLUTION_REWARD');
      default:
        return transactions;
    }
  };

  const formatAddress = (address: string) => {
    if (address === '0x0000000000000000000000000000000000000000') {
      return 'Contract';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'MINING_REWARD':
        return '⛏️';
      case 'EVOLUTION_REWARD':
        return '🧬';
      case 'TRANSFER':
        return '💸';
      case 'APPROVAL':
        return '✅';
      default:
        return '📄';
    }
  };

  const getTransactionColor = (type: string, from: string, to: string) => {
    if (type === 'MINING_REWARD' || type === 'EVOLUTION_REWARD') {
      return 'text-green-400';
    }
    if (walletState?.address && from.toLowerCase() === walletState.address.toLowerCase()) {
      return 'text-red-400'; // Sent
    }
    return 'text-blue-400'; // Received
  };

  if (!walletState?.isConnected) {
    return (
      <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-500 text-xl">📊</span>
        </div>
        <h3 className="text-lg font-bold text-gray-400 mb-2">Wallet Required</h3>
        <p className="text-sm text-gray-500">Connect your wallet to view transaction history</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/90 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Transaction History</h3>
        <div className="flex items-center gap-2">
          {isListening && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Live
            </div>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="flex gap-2 mb-4">
          {['all', 'sent', 'received', 'rewards'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType as any)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                filter === filterType
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-500/20 text-gray-400 hover:text-white'
              }`}
            >
              {filterType}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border border-white/30 border-t-white rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-400">Loading transactions...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : getFilteredTransactions().length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-500 text-xl">📭</span>
          </div>
          <p className="text-gray-400">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {getFilteredTransactions().map((tx, index) => (
            <div
              key={`${tx.hash}-${index}`}
              className="p-4 bg-black/40 border border-white/5 rounded-lg hover:border-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getTransactionIcon(tx.type)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{tx.type.replace('_', ' ')}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        tx.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{formatDate(tx.timestamp)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold mono ${getTransactionColor(tx.type, tx.from, tx.to)}`}>
                    {tx.type === 'MINING_REWARD' || tx.type === 'EVOLUTION_REWARD' || 
                     (walletState.address && tx.to.toLowerCase() === walletState.address.toLowerCase()) ? '+' : '-'}
                    {tx.amount} QBS
                  </div>
                  {tx.blockNumber && (
                    <div className="text-xs text-gray-500">Block #{tx.blockNumber}</div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <span>From: {formatAddress(tx.from)}</span>
                  <span>→</span>
                  <span>To: {formatAddress(tx.to)}</span>
                </div>
                {tx.explorerUrl && (
                  <a
                    href={tx.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    View →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;