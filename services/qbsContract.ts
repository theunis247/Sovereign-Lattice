import { ethers } from 'ethers';
import { walletConnector } from './walletConnector';
import { getContractAddress, getNetworkConfig } from './networkConfig';

// QBS Token Contract ABI (essential functions only)
export const QBS_TOKEN_ABI = [
  // Read functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function remainingSupply() view returns (uint256)",
  "function getMiningRewards(address user) view returns (uint256)",
  "function isAuthorizedMiner(address miner) view returns (bool)",
  
  // Write functions
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mintMiningReward(address to, uint256 amount, string blockId, string grade) returns (bool)",
  "function mintEvolutionReward(address to, uint256 amount, string blockId, uint256 newLevel) returns (bool)",
  "function burn(uint256 amount)",
  "function burnFrom(address from, uint256 amount)",
  
  // Owner functions
  "function authorizeMiner(address miner)",
  "function revokeMiner(address miner)",
  "function pause()",
  "function unpause()",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event MiningReward(address indexed miner, uint256 amount, string blockId, string grade)",
  "event EvolutionReward(address indexed user, uint256 amount, string blockId, uint256 newLevel)",
  "event MinerAuthorized(address indexed miner)",
  "event MinerRevoked(address indexed miner)"
];

export interface QBSTokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  maxSupply: string;
  remainingSupply: string;
}

export interface MiningRewardRequest {
  recipient: string;
  amount: string; // In QBS tokens (will be converted to wei)
  blockId: string;
  grade: 'S' | 'A' | 'B' | 'C';
}

export interface EvolutionRewardRequest {
  recipient: string;
  amount: string; // In QBS tokens (will be converted to wei)
  blockId: string;
  newLevel: number;
}

export interface TransactionResult {
  hash: string;
  success: boolean;
  error?: string;
}

/**
 * QBS Token Contract Service
 * Handles all interactions with the deployed QBS token smart contract
 */
export class QBSContractService {
  private contract: ethers.Contract | null = null;
  private readOnlyContract: ethers.Contract | null = null;

  constructor() {
    this.initializeContracts();
  }

  /**
   * Initialize contract instances
   */
  private async initializeContracts(): Promise<void> {
    try {
      const walletState = await walletConnector.getWalletState();
      
      if (!walletState.chainId) {
        return;
      }

      const contractAddress = getContractAddress(walletState.chainId);
      if (!contractAddress) {
        console.warn(`No QBS contract deployed on chain ${walletState.chainId}`);
        return;
      }

      const networkConfig = getNetworkConfig(walletState.chainId);
      if (!networkConfig) {
        return;
      }

      // Create read-only contract for queries
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      this.readOnlyContract = new ethers.Contract(contractAddress, QBS_TOKEN_ABI, provider);

      // Create write contract if wallet is connected
      if (walletState.isConnected) {
        const signer = walletConnector.getCurrentSigner();
        if (signer) {
          this.contract = new ethers.Contract(contractAddress, QBS_TOKEN_ABI, signer);
        }
      }
    } catch (error) {
      console.error('Failed to initialize QBS contracts:', error);
    }
  }

  /**
   * Ensure contracts are initialized for current network
   */
  private async ensureContracts(): Promise<void> {
    if (!this.contract || !this.readOnlyContract) {
      await this.initializeContracts();
    }
  }

  /**
   * Get token information
   */
  public async getTokenInfo(): Promise<QBSTokenInfo | null> {
    try {
      await this.ensureContracts();
      
      if (!this.readOnlyContract) {
        throw new Error('Contract not available on current network');
      }

      const [name, symbol, decimals, totalSupply, maxSupply, remainingSupply] = await Promise.all([
        this.readOnlyContract.name(),
        this.readOnlyContract.symbol(),
        this.readOnlyContract.decimals(),
        this.readOnlyContract.totalSupply(),
        this.readOnlyContract.MAX_SUPPLY(),
        this.readOnlyContract.remainingSupply()
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatEther(totalSupply),
        maxSupply: ethers.formatEther(maxSupply),
        remainingSupply: ethers.formatEther(remainingSupply)
      };
    } catch (error) {
      console.error('Failed to get token info:', error);
      return null;
    }
  }

  /**
   * Get QBS balance for an address
   */
  public async getBalance(address: string): Promise<string> {
    try {
      await this.ensureContracts();
      
      if (!this.readOnlyContract) {
        return '0';
      }

      const balance = await this.readOnlyContract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  /**
   * Get total mining rewards for an address
   */
  public async getMiningRewards(address: string): Promise<string> {
    try {
      await this.ensureContracts();
      
      if (!this.readOnlyContract) {
        return '0';
      }

      const rewards = await this.readOnlyContract.getMiningRewards(address);
      return ethers.formatEther(rewards);
    } catch (error) {
      console.error('Failed to get mining rewards:', error);
      return '0';
    }
  }

  /**
   * Check if an address is an authorized miner
   */
  public async isAuthorizedMiner(address: string): Promise<boolean> {
    try {
      await this.ensureContracts();
      
      if (!this.readOnlyContract) {
        return false;
      }

      return await this.readOnlyContract.isAuthorizedMiner(address);
    } catch (error) {
      console.error('Failed to check miner authorization:', error);
      return false;
    }
  }

  /**
   * Mint mining reward tokens
   */
  public async mintMiningReward(request: MiningRewardRequest): Promise<TransactionResult> {
    try {
      await this.ensureContracts();
      
      if (!this.contract) {
        throw new Error('Wallet not connected or contract not available');
      }

      const amountWei = ethers.parseEther(request.amount);
      
      const tx = await this.contract.mintMiningReward(
        request.recipient,
        amountWei,
        request.blockId,
        request.grade
      );

      const receipt = await tx.wait();
      
      return {
        hash: tx.hash,
        success: receipt.status === 1
      };
    } catch (error: any) {
      console.error('Failed to mint mining reward:', error);
      return {
        hash: '',
        success: false,
        error: error.message || 'Transaction failed'
      };
    }
  }

  /**
   * Mint evolution reward tokens
   */
  public async mintEvolutionReward(request: EvolutionRewardRequest): Promise<TransactionResult> {
    try {
      await this.ensureContracts();
      
      if (!this.contract) {
        throw new Error('Wallet not connected or contract not available');
      }

      const amountWei = ethers.parseEther(request.amount);
      
      const tx = await this.contract.mintEvolutionReward(
        request.recipient,
        amountWei,
        request.blockId,
        request.newLevel
      );

      const receipt = await tx.wait();
      
      return {
        hash: tx.hash,
        success: receipt.status === 1
      };
    } catch (error: any) {
      console.error('Failed to mint evolution reward:', error);
      return {
        hash: '',
        success: false,
        error: error.message || 'Transaction failed'
      };
    }
  }

  /**
   * Transfer QBS tokens
   */
  public async transfer(to: string, amount: string): Promise<TransactionResult> {
    try {
      await this.ensureContracts();
      
      if (!this.contract) {
        throw new Error('Wallet not connected or contract not available');
      }

      const amountWei = ethers.parseEther(amount);
      
      const tx = await this.contract.transfer(to, amountWei);
      const receipt = await tx.wait();
      
      return {
        hash: tx.hash,
        success: receipt.status === 1
      };
    } catch (error: any) {
      console.error('Failed to transfer tokens:', error);
      return {
        hash: '',
        success: false,
        error: error.message || 'Transaction failed'
      };
    }
  }

  /**
   * Approve token spending
   */
  public async approve(spender: string, amount: string): Promise<TransactionResult> {
    try {
      await this.ensureContracts();
      
      if (!this.contract) {
        throw new Error('Wallet not connected or contract not available');
      }

      const amountWei = ethers.parseEther(amount);
      
      const tx = await this.contract.approve(spender, amountWei);
      const receipt = await tx.wait();
      
      return {
        hash: tx.hash,
        success: receipt.status === 1
      };
    } catch (error: any) {
      console.error('Failed to approve tokens:', error);
      return {
        hash: '',
        success: false,
        error: error.message || 'Transaction failed'
      };
    }
  }

  /**
   * Burn tokens
   */
  public async burn(amount: string): Promise<TransactionResult> {
    try {
      await this.ensureContracts();
      
      if (!this.contract) {
        throw new Error('Wallet not connected or contract not available');
      }

      const amountWei = ethers.parseEther(amount);
      
      const tx = await this.contract.burn(amountWei);
      const receipt = await tx.wait();
      
      return {
        hash: tx.hash,
        success: receipt.status === 1
      };
    } catch (error: any) {
      console.error('Failed to burn tokens:', error);
      return {
        hash: '',
        success: false,
        error: error.message || 'Transaction failed'
      };
    }
  }

  /**
   * Estimate gas for a transaction
   */
  public async estimateGas(method: string, params: any[]): Promise<string> {
    try {
      await this.ensureContracts();
      
      if (!this.contract) {
        throw new Error('Contract not available');
      }

      const gasEstimate = await this.contract[method].estimateGas(...params);
      return ethers.formatUnits(gasEstimate, 'gwei');
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return '0';
    }
  }

  /**
   * Listen for contract events
   */
  public onMiningReward(callback: (event: any) => void): void {
    if (this.readOnlyContract) {
      this.readOnlyContract.on('MiningReward', callback);
    }
  }

  public onEvolutionReward(callback: (event: any) => void): void {
    if (this.readOnlyContract) {
      this.readOnlyContract.on('EvolutionReward', callback);
    }
  }

  public onTransfer(callback: (event: any) => void): void {
    if (this.readOnlyContract) {
      this.readOnlyContract.on('Transfer', callback);
    }
  }

  /**
   * Remove event listeners
   */
  public removeAllListeners(): void {
    if (this.readOnlyContract) {
      this.readOnlyContract.removeAllListeners();
    }
  }

  /**
   * Check if contract is available on current network
   */
  public async isAvailable(): Promise<boolean> {
    try {
      await this.ensureContracts();
      return this.readOnlyContract !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get current contract address
   */
  public async getContractAddress(): Promise<string | null> {
    const walletState = await walletConnector.getWalletState();
    if (!walletState.chainId) return null;
    return getContractAddress(walletState.chainId) || null;
  }
}

// Singleton instance
export const qbsContract = new QBSContractService();