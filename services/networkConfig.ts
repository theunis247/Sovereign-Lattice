export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  contractAddress?: string;
  symbol: string;
  decimals: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    explorerUrl: 'https://etherscan.io',
    symbol: 'QBS',
    decimals: 18,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  
  // Ethereum Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    explorerUrl: 'https://sepolia.etherscan.io',
    symbol: 'QBS',
    decimals: 18,
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  
  // Polygon Mainnet
  137: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    symbol: 'QBS',
    decimals: 18,
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  
  // Polygon Mumbai Testnet
  80001: {
    chainId: 80001,
    name: 'Mumbai Testnet',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorerUrl: 'https://mumbai.polygonscan.com',
    symbol: 'QBS',
    decimals: 18,
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  
  // Hardhat Local Network
  1337: {
    chainId: 1337,
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    explorerUrl: 'http://localhost:8545',
    symbol: 'QBS',
    decimals: 18,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }
};

export const DEFAULT_NETWORK = SUPPORTED_NETWORKS[11155111]; // Sepolia testnet

export const getNetworkConfig = (chainId: number): NetworkConfig | null => {
  return SUPPORTED_NETWORKS[chainId] || null;
};

export const isNetworkSupported = (chainId: number): boolean => {
  return chainId in SUPPORTED_NETWORKS;
};

export const getExplorerUrl = (chainId: number, txHash: string): string => {
  const network = getNetworkConfig(chainId);
  if (!network) return '';
  return `${network.explorerUrl}/tx/${txHash}`;
};

export const getAddressExplorerUrl = (chainId: number, address: string): string => {
  const network = getNetworkConfig(chainId);
  if (!network) return '';
  return `${network.explorerUrl}/address/${address}`;
};

// Contract addresses for different networks (to be updated after deployment)
export const CONTRACT_ADDRESSES: Record<number, string> = {
  1: '', // Ethereum Mainnet - TBD
  11155111: '', // Sepolia - TBD
  137: '', // Polygon - TBD
  80001: '', // Mumbai - TBD
  1337: '' // Local - TBD
};

export const getContractAddress = (chainId: number): string => {
  return CONTRACT_ADDRESSES[chainId] || '';
};