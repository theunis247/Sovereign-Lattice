import { qbsContract, MiningRewardRequest, EvolutionRewardRequest, TransactionResult } from './qbsContract';
import { walletConnector } from './walletConnector';
import { getExplorerUrl } from './networkConfig';
import { GRADE_MULTIPLIERS } from './quantumLogic';

export interface PendingReward {
  id: string;
  type: 'MINING' | 'EVOLUTION';
  recipient: string;
  amount: string;
  blockId: string;
  grade?: 'S' | 'A' | 'B' | 'C';
  newLevel?: number;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  error?: string;
}

export interface RewardDistributionResult {
  success: boolean;
  transactionHash?: string;
  explorerUrl?: string;
  error?: string;
  queued?: boolean;
}

/**
 * Reward Distribution Service
 * Handles blockchain reward distribution with queuing and retry logic
 */
export class RewardDistributionService {
  private pendingRewards: PendingReward[] = [];
  private isProcessing = false;
  private readonly STORAGE_KEY = 'QBS_PENDING_REWARDS';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds

  constructor() {
    this.loadPendingRewards();
    this.startProcessingLoop();
  }

  /**
   * Load pending rewards from localStorage
   */
  private loadPendingRewards(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.pendingRewards = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load pending rewards:', error);
      this.pendingRewards = [];
    }
  }

  /**
   * Save pending rewards to localStorage
   */
  private savePendingRewards(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.pendingRewards));
    } catch (error) {
      console.error('Failed to save pending rewards:', error);
    }
  }

  /**
   * Start the processing loop for pending rewards
   */
  private startProcessingLoop(): void {
    setInterval(() => {
      if (!this.isProcessing && this.pendingRewards.length > 0) {
        this.processPendingRewards();
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Distribute mining reward
   */
  public async distributeMiningReward(
    recipient: string,
    baseAmount: number,
    grade: 'S' | 'A' | 'B' | 'C',
    blockId: string
  ): Promise<RewardDistributionResult> {
    try {
      // Calculate final reward amount based on grade
      const multiplier = GRADE_MULTIPLIERS[grade];
      const finalAmount = (baseAmount * multiplier).toString();

      // Check if wallet is connected and contract is available
      const walletState = await walletConnector.getWalletState();
      const isContractAvailable = await qbsContract.isAvailable();

      if (!walletState.isConnected || !isContractAvailable) {
        // Queue the reward for later processing
        const pendingReward: PendingReward = {
          id: `mining-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'MINING',
          recipient,
          amount: finalAmount,
          blockId,
          grade,
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: this.MAX_RETRIES
        };

        this.pendingRewards.push(pendingReward);
        this.savePendingRewards();

        return {
          success: true,
          queued: true,
          error: walletState.isConnected 
            ? 'Contract not available on current network. Reward queued.'
            : 'Wallet not connected. Reward queued for when wallet is connected.'
        };
      }

      // Attempt immediate distribution
      const request: MiningRewardRequest = {
        recipient,
        amount: finalAmount,
        blockId,
        grade
      };

      const result = await qbsContract.mintMiningReward(request);

      if (result.success) {
        const explorerUrl = walletState.chainId 
          ? getExplorerUrl(walletState.chainId, result.hash)
          : undefined;

        return {
          success: true,
          transactionHash: result.hash,
          explorerUrl
        };
      } else {
        // Queue for retry if transaction failed
        const pendingReward: PendingReward = {
          id: `mining-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'MINING',
          recipient,
          amount: finalAmount,
          blockId,
          grade,
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: this.MAX_RETRIES,
          error: result.error
        };

        this.pendingRewards.push(pendingReward);
        this.savePendingRewards();

        return {
          success: false,
          error: result.error,
          queued: true
        };
      }
    } catch (error: any) {
      console.error('Failed to distribute mining reward:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Distribute evolution reward
   */
  public async distributeEvolutionReward(
    recipient: string,
    amount: number,
    blockId: string,
    newLevel: number
  ): Promise<RewardDistributionResult> {
    try {
      const amountStr = amount.toString();

      // Check if wallet is connected and contract is available
      const walletState = await walletConnector.getWalletState();
      const isContractAvailable = await qbsContract.isAvailable();

      if (!walletState.isConnected || !isContractAvailable) {
        // Queue the reward for later processing
        const pendingReward: PendingReward = {
          id: `evolution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'EVOLUTION',
          recipient,
          amount: amountStr,
          blockId,
          newLevel,
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: this.MAX_RETRIES
        };

        this.pendingRewards.push(pendingReward);
        this.savePendingRewards();

        return {
          success: true,
          queued: true,
          error: walletState.isConnected 
            ? 'Contract not available on current network. Reward queued.'
            : 'Wallet not connected. Reward queued for when wallet is connected.'
        };
      }

      // Attempt immediate distribution
      const request: EvolutionRewardRequest = {
        recipient,
        amount: amountStr,
        blockId,
        newLevel
      };

      const result = await qbsContract.mintEvolutionReward(request);

      if (result.success) {
        const explorerUrl = walletState.chainId 
          ? getExplorerUrl(walletState.chainId, result.hash)
          : undefined;

        return {
          success: true,
          transactionHash: result.hash,
          explorerUrl
        };
      } else {
        // Queue for retry if transaction failed
        const pendingReward: PendingReward = {
          id: `evolution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'EVOLUTION',
          recipient,
          amount: amountStr,
          blockId,
          newLevel,
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: this.MAX_RETRIES,
          error: result.error
        };

        this.pendingRewards.push(pendingReward);
        this.savePendingRewards();

        return {
          success: false,
          error: result.error,
          queued: true
        };
      }
    } catch (error: any) {
      console.error('Failed to distribute evolution reward:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Process all pending rewards
   */
  private async processPendingRewards(): Promise<void> {
    if (this.isProcessing || this.pendingRewards.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const walletState = await walletConnector.getWalletState();
      const isContractAvailable = await qbsContract.isAvailable();

      if (!walletState.isConnected || !isContractAvailable) {
        // Can't process rewards without wallet connection and contract
        this.isProcessing = false;
        return;
      }

      // Process rewards one by one
      const rewardsToProcess = [...this.pendingRewards];
      
      for (const reward of rewardsToProcess) {
        try {
          let result: TransactionResult;

          if (reward.type === 'MINING') {
            const request: MiningRewardRequest = {
              recipient: reward.recipient,
              amount: reward.amount,
              blockId: reward.blockId,
              grade: reward.grade!
            };
            result = await qbsContract.mintMiningReward(request);
          } else {
            const request: EvolutionRewardRequest = {
              recipient: reward.recipient,
              amount: reward.amount,
              blockId: reward.blockId,
              newLevel: reward.newLevel!
            };
            result = await qbsContract.mintEvolutionReward(request);
          }

          if (result.success) {
            // Remove successful reward from pending list
            this.pendingRewards = this.pendingRewards.filter(r => r.id !== reward.id);
            console.log(`Successfully processed ${reward.type} reward:`, result.hash);
          } else {
            // Increment retry count
            const rewardIndex = this.pendingRewards.findIndex(r => r.id === reward.id);
            if (rewardIndex !== -1) {
              this.pendingRewards[rewardIndex].retryCount++;
              this.pendingRewards[rewardIndex].error = result.error;

              // Remove if max retries exceeded
              if (this.pendingRewards[rewardIndex].retryCount >= this.pendingRewards[rewardIndex].maxRetries) {
                console.error(`Max retries exceeded for ${reward.type} reward:`, reward.id);
                this.pendingRewards.splice(rewardIndex, 1);
              }
            }
          }

          // Small delay between transactions
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error processing ${reward.type} reward:`, error);
          
          // Increment retry count for this reward
          const rewardIndex = this.pendingRewards.findIndex(r => r.id === reward.id);
          if (rewardIndex !== -1) {
            this.pendingRewards[rewardIndex].retryCount++;
            this.pendingRewards[rewardIndex].error = error.message;

            if (this.pendingRewards[rewardIndex].retryCount >= this.pendingRewards[rewardIndex].maxRetries) {
              this.pendingRewards.splice(rewardIndex, 1);
            }
          }
        }
      }

      this.savePendingRewards();
    } catch (error) {
      console.error('Error in reward processing loop:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get pending rewards count
   */
  public getPendingRewardsCount(): number {
    return this.pendingRewards.length;
  }

  /**
   * Get pending rewards
   */
  public getPendingRewards(): PendingReward[] {
    return [...this.pendingRewards];
  }

  /**
   * Clear all pending rewards (use with caution)
   */
  public clearPendingRewards(): void {
    this.pendingRewards = [];
    this.savePendingRewards();
  }

  /**
   * Force process pending rewards now
   */
  public async forceProcessPendingRewards(): Promise<void> {
    if (!this.isProcessing) {
      await this.processPendingRewards();
    }
  }

  /**
   * Get processing status
   */
  public isProcessingRewards(): boolean {
    return this.isProcessing;
  }
}

// Singleton instance
export const rewardDistribution = new RewardDistributionService();