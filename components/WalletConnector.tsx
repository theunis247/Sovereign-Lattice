import React, { useState, useEffect } from 'react';
import { walletConnector, WalletState } from '../services/walletConnector';

interface WalletConnectorProps {
  onWalletStateChange?: (state: WalletState) => void;
}

const WalletConnector: React.FC<WalletConnectorProps> = ({ onWalletStateChange }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: '0',
    isMetaMaskInstalled: false,
    networkName: null
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNetworkSwitcher, setShowNetworkSwitcher] = useState(false);

  useEffect(() => {
    const handleStateChange = (state: WalletState) => {
      setWalletState(state);
      onWalletStateChange?.(state);
    };

    walletConnector.onStateChange(handleStateChange);

    return () => {
      walletConnector.removeStateListener(handleStateChange);
    };
  }, [onWalletStateChange]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      await walletConnector.connect();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      // Show disconnecting state
      setIsConnecting(true);
      
      await walletConnector.disconnect();
      
      // Force update the wallet state
      setWalletState({
        isConnected: false,
        address: null,
        chainId: null,
        balance: '0',
        isMetaMaskInstalled: true,
        networkName: null
      });
      
      console.log('✅ Wallet disconnected successfully from UI');
      
    } catch (error: any) {
      console.error('❌ Disconnect error:', error);
      setError(`Disconnect failed: ${error.message}`);
      
      // Force disconnect even if there's an error
      setWalletState({
        isConnected: false,
        address: null,
        chainId: null,
        balance: '0',
        isMetaMaskInstalled: true,
        networkName: null
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSwitchNetwork = async (chainId: number) => {
    try {
      setError(null);
      await walletConnector.switchNetwork(chainId);
      setShowNetworkSwitcher(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  const isNetworkSupported = walletState.chainId ? walletConnector.isNetworkSupported(walletState.chainId) : false;
  const supportedNetworks = walletConnector.getSupportedNetworks();

  if (!walletState.isMetaMaskInstalled) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-sm">⚠</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-400">MetaMask Required</h3>
            <p className="text-xs text-gray-400">Install MetaMask to connect your wallet</p>
          </div>
        </div>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-full bg-red-500 hover:bg-red-400 text-white text-xs font-bold py-2 px-4 rounded-lg text-center transition-colors"
        >
          Install MetaMask
        </a>
      </div>
    );
  }

  if (!walletState.isConnected) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
            <span className="text-blue-500 text-sm">🔗</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-400">Connect Wallet</h3>
            <p className="text-xs text-gray-400">Connect MetaMask to access blockchain features</p>
          </div>
        </div>
        
        {error && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
        
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isConnecting ? (
            <>
              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
              Connecting...
            </>
          ) : (
            'Connect MetaMask'
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-green-500 text-sm">✓</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-green-400">Wallet Connected</h3>
            <p className="text-xs text-gray-400 mono">{formatAddress(walletState.address!)}</p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={isConnecting}
          className="text-xs text-gray-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded border border-gray-600 hover:border-red-400 flex items-center gap-1"
        >
          {isConnecting ? (
            <>
              <div className="w-2 h-2 border border-gray-400/30 border-t-gray-400 rounded-full animate-spin"></div>
              Disconnecting...
            </>
          ) : (
            'Disconnect'
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-black/20 rounded-lg p-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Balance</p>
          <p className="text-sm font-bold text-white mono">{formatBalance(walletState.balance)} ETH</p>
        </div>
        <div className="bg-black/20 rounded-lg p-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Network</p>
          <p className={`text-sm font-bold mono ${isNetworkSupported ? 'text-green-400' : 'text-yellow-400'}`}>
            {walletState.networkName}
          </p>
        </div>
      </div>

      {!isNetworkSupported && (
        <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-400 mb-2">⚠ Unsupported network. Switch to a supported network:</p>
          <button
            onClick={() => setShowNetworkSwitcher(!showNetworkSwitcher)}
            className="text-xs text-yellow-400 hover:text-yellow-300 underline"
          >
            {showNetworkSwitcher ? 'Hide Networks' : 'Show Supported Networks'}
          </button>
        </div>
      )}

      {showNetworkSwitcher && (
        <div className="mb-3 space-y-2">
          {supportedNetworks.map((network) => (
            <button
              key={network.chainId}
              onClick={() => handleSwitchNetwork(network.chainId)}
              className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                walletState.chainId === network.chainId
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
              }`}
            >
              <div className="font-bold">{network.name}</div>
              <div className="text-xs opacity-75">Chain ID: {network.chainId}</div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

export default WalletConnector;