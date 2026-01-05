import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { getNetworkConfig, isNetworkSupported, SUPPORTED_NETWORKS } from './networkConfig';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string;
  isMetaMaskInstalled: boolean;
  networkName: string | null;
}

export interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export class WalletConnector {
  private provider: any = null;
  private signer: ethers.Signer | null = null;
  private listeners: ((state: WalletState) => void)[] = [];

  constructor() {
    this.initializeProvider();
  }

  private async initializeProvider() {
    try {
      this.provider = await detectEthereumProvider();
      if (this.provider) {
        this.setupEventListeners();
      }
    } catch (error) {
      console.error('Failed to initialize wallet provider:', error);
    }
  }

  private setupEventListeners() {
    if (!this.provider) return;

    // Account changes
    this.provider.on('accountsChanged', (accounts: string[]) => {
      this.notifyStateChange();
    });

    // Chain changes
    this.provider.on('chainChanged', (chainId: string) => {
      this.notifyStateChange();
    });

    // Connection changes
    this.provider.on('connect', () => {
      this.notifyStateChange();
    });

    this.provider.on('disconnect', () => {
      this.notifyStateChange();
    });
  }

  public onStateChange(callback: (state: WalletState) => void) {
    this.listeners.push(callback);
    // Immediately call with current state
    this.getWalletState().then(callback);
  }

  public removeStateListener(callback: (state: WalletState) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyStateChange() {
    this.getWalletState().then(state => {
      this.listeners.forEach(listener => listener(state));
    });
  }

  public async connect(): Promise<WalletState> {
    if (!this.provider) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      // Request account access
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Create ethers provider and signer
      const ethersProvider = new ethers.BrowserProvider(this.provider);
      this.signer = await ethersProvider.getSigner();

      const state = await this.getWalletState();
      this.notifyStateChange();
      return state;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request.');
      }
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  public async disconnect(): Promise<void> {
    this.signer = null;
    this.notifyStateChange();
  }

  public async getWalletState(): Promise<WalletState> {
    const isMetaMaskInstalled = !!this.provider;
    
    if (!isMetaMaskInstalled) {
      return {
        isConnected: false,
        address: null,
        chainId: null,
        balance: '0',
        isMetaMaskInstalled: false,
        networkName: null
      };
    }

    try {
      const accounts = await this.provider.request({ method: 'eth_accounts' });
      const chainId = await this.provider.request({ method: 'eth_chainId' });
      const chainIdNumber = parseInt(chainId, 16);
      
      const isConnected = accounts.length > 0;
      const address = isConnected ? accounts[0] : null;
      
      let balance = '0';
      if (isConnected && address) {
        const balanceWei = await this.provider.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        });
        balance = ethers.formatEther(balanceWei);
      }

      const networkConfig = getNetworkConfig(chainIdNumber);
      const networkName = networkConfig?.name || `Unknown Network (${chainIdNumber})`;

      return {
        isConnected,
        address,
        chainId: chainIdNumber,
        balance,
        isMetaMaskInstalled: true,
        networkName
      };
    } catch (error) {
      console.error('Error getting wallet state:', error);
      return {
        isConnected: false,
        address: null,
        chainId: null,
        balance: '0',
        isMetaMaskInstalled: true,
        networkName: null
      };
    }
  }

  public async switchNetwork(chainId: number): Promise<void> {
    if (!this.provider) {
      throw new Error('MetaMask is not installed');
    }

    const networkConfig = getNetworkConfig(chainId);
    if (!networkConfig) {
      throw new Error(`Unsupported network: ${chainId}`);
    }

    try {
      // Try to switch to the network
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: networkConfig.name,
              nativeCurrency: networkConfig.nativeCurrency,
              rpcUrls: [networkConfig.rpcUrl],
              blockExplorerUrls: [networkConfig.explorerUrl]
            }],
          });
        } catch (addError) {
          throw new Error(`Failed to add network: ${addError.message}`);
        }
      } else {
        throw new Error(`Failed to switch network: ${switchError.message}`);
      }
    }
  }

  public async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('MetaMask is not installed');
    }

    try {
      const balanceWei = await this.provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      return ethers.formatEther(balanceWei);
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  public async sendTransaction(transaction: TransactionRequest): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.signer.sendTransaction({
        to: transaction.to,
        value: transaction.value ? ethers.parseEther(transaction.value) : undefined,
        data: transaction.data,
        gasLimit: transaction.gasLimit,
        gasPrice: transaction.gasPrice
      });

      return tx.hash;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the transaction');
      }
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  public async estimateGas(transaction: TransactionRequest): Promise<string> {
    if (!this.provider) {
      throw new Error('MetaMask is not installed');
    }

    try {
      const gasEstimate = await this.provider.request({
        method: 'eth_estimateGas',
        params: [{
          to: transaction.to,
          value: transaction.value ? `0x${ethers.parseEther(transaction.value).toString(16)}` : undefined,
          data: transaction.data
        }]
      });
      
      return ethers.formatUnits(gasEstimate, 'gwei');
    } catch (error: any) {
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }

  public async waitForTransaction(txHash: string): Promise<any> {
    if (!this.provider) {
      throw new Error('MetaMask is not installed');
    }

    const ethersProvider = new ethers.BrowserProvider(this.provider);
    return await ethersProvider.waitForTransaction(txHash);
  }

  public isNetworkSupported(chainId: number): boolean {
    return isNetworkSupported(chainId);
  }

  public getSupportedNetworks() {
    return Object.values(SUPPORTED_NETWORKS);
  }

  public getCurrentSigner(): ethers.Signer | null {
    return this.signer;
  }

  public getProvider(): any {
    return this.provider;
  }
}

// Singleton instance
export const walletConnector = new WalletConnector();