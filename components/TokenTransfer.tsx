import React, { useState, useEffect } from 'react';
import { qbsContract } from '../services/qbsContract';
import { walletConnector } from '../services/walletConnector';
import { getExplorerUrl, getAddressExplorerUrl } from '../services/networkConfig';

interface TokenTransferProps {
  onTransferComplete?: (hash: string, success: boolean) => void;
  onClose?: () => void;
}

const TokenTransfer: React.FC<TokenTransferProps> = ({ onTransferComplete, onClose }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState('0');
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [walletState, setWalletState] = useState<any>(null);

  useEffect(() => {
    loadWalletInfo();
    
    const handleWalletChange = (state: any) => {
      setWalletState(state);
      if (state.isConnected && state.address) {
        loadBalance(state.address);
      }
    };

    walletConnector.onStateChange(handleWalletChange);
    return () => walletConnector.removeStateListener(handleWalletChange);
  }, []);

  const loadWalletInfo = async () => {
    const state = await walletConnector.getWalletState();
    setWalletState(state);
    
    if (state.isConnected && state.address) {
      await loadBalance(state.address);
    }
  };

  const loadBalance = async (address: string) => {
    try {
      const balance = await qbsContract.getBalance(address);
      setUserBalance(balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const validateAddress = (address: string): boolean => {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const validateAmount = (amount: string): boolean => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= parseFloat(userBalance);
  };

  const estimateGas = async () => {
    if (!recipient || !amount || !validateAddress(recipient) || !validateAmount(amount)) {
      setGasEstimate(null);
      return;
    }

    try {
      const estimate = await qbsContract.estimateGas('transfer', [recipient, amount]);
      setGasEstimate(estimate);
    } catch (error) {
      console.error('Gas estimation failed:', error);
      setGasEstimate(null);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (recipient && amount) {
        estimateGas();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [recipient, amount]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!walletState?.isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!validateAddress(recipient)) {
      setError('Invalid recipient address');
      return;
    }

    if (!validateAmount(amount)) {
      setError('Invalid amount or insufficient balance');
      return;
    }

    setIsTransferring(true);

    try {
      const result = await qbsContract.transfer(recipient, amount);

      if (result.success) {
        setSuccess(`Transfer successful! Transaction: ${result.hash.slice(0, 10)}...`);
        setRecipient('');
        setAmount('');
        
        // Reload balance
        if (walletState.address) {
          await loadBalance(walletState.address);
        }

        onTransferComplete?.(result.hash, true);
      } else {
        setError(result.error || 'Transfer failed');
        onTransferComplete?.('', false);
      }
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
      onTransferComplete?.('', false);
    } finally {
      setIsTransferring(false);
    }
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return num.toFixed(6);
  };

  const getExplorerLink = (address: string) => {
    if (walletState?.chainId) {
      return getAddressExplorerUrl(walletState.chainId, address);
    }
    return null;
  };

  if (!walletState?.isConnected) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-yellow-500 text-xl">⚠</span>
        </div>
        <h3 className="text-lg font-bold text-yellow-400 mb-2">Wallet Required</h3>
        <p className="text-sm text-gray-400 mb-4">Connect your MetaMask wallet to transfer QBS tokens</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white text-sm font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/90 border border-white/10 rounded-xl p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Transfer QBS Tokens</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-blue-400">Your QBS Balance:</span>
          <span className="text-lg font-bold text-white mono">{formatBalance(userBalance)} QBS</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Address: {walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}
        </div>
      </div>

      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-blue-500 transition-all text-white font-mono"
            required
          />
          {recipient && !validateAddress(recipient) && (
            <p className="text-xs text-red-400 mt-1">Invalid Ethereum address</p>
          )}
          {recipient && validateAddress(recipient) && (
            <div className="mt-1">
              <a
                href={getExplorerLink(recipient) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                View on Explorer →
              </a>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">
            Amount (QBS)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.000001"
              min="0"
              max={userBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.000000"
              className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-blue-500 transition-all text-white font-mono pr-16"
              required
            />
            <button
              type="button"
              onClick={() => setAmount(userBalance)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 font-bold"
            >
              MAX
            </button>
          </div>
          {amount && !validateAmount(amount) && (
            <p className="text-xs text-red-400 mt-1">
              {parseFloat(amount) > parseFloat(userBalance) ? 'Insufficient balance' : 'Invalid amount'}
            </p>
          )}
        </div>

        {gasEstimate && (
          <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Estimated Gas:</span>
              <span className="text-white mono">{gasEstimate} Gwei</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isTransferring || !recipient || !amount || !validateAddress(recipient) || !validateAmount(amount)}
          className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isTransferring ? (
            <>
              <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin"></div>
              Transferring...
            </>
          ) : (
            'Transfer QBS Tokens'
          )}
        </button>
      </form>

      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-xs text-yellow-400">
          <strong>⚠ Important:</strong> Double-check the recipient address. Blockchain transactions cannot be reversed.
        </p>
      </div>
    </div>
  );
};

export default TokenTransfer;