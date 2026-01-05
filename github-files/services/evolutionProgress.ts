import { EvolutionProgress, EvolutionStage } from '../types';
import { profileManager } from './profileManager';
import { createProfileIsolationManager } from './profileIsolation';
import { createDataSegregator } from './dataSegregator';

// Initialize data segregator and profile isolation manager
const dataSegregator = createDataSegregator();
const profileIsolationManager = createProfileIsolationManager(dataSegregator);

export const EVOLUTION_STAGES: EvolutionStage[] = [
  {
    name: 'analyzing',
    duration: 2000,
    message: 'Analyzing current breakthrough formulation...',
    color: '#3b82f6', // blue
    icon: '🔍'
  },
  {
    name: 'synthesizing', 
    duration: 8000,
    message: 'Synthesizing advanced mathematical frameworks...',
    color: '#8b5cf6', // purple
    icon: '⚗️'
  },
  {
    name: 'validating',
    duration: 3000,
    message: 'Validating scientific accuracy and consistency...',
    color: '#f59e0b', // amber
    icon: '✓'
  },
  {
    name: 'finalizing',
    duration: 1000,
    message: 'Finalizing evolution results and updating records...',
    color: '#10b981', // green
    icon: '🎯'
  }
];

export class EvolutionProgressTracker {
  private progressCallbacks: Map<string, (progress: EvolutionProgress) => void> = new Map();
  private activeEvolutions: Map<string, EvolutionProgress> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private profileEvolutions: Map<string, Set<string>> = new Map(); // profileId -> Set of blockIds

  /**
   * Start tracking evolution progress for a breakthrough with profile validation
   */
  async startEvolution(blockId: string, onProgress: (progress: EvolutionProgress) => void, profileId?: string): Promise<void> {
    try {
      // Validate profile access if profileId is provided
      if (profileId) {
        const currentProfile = profileManager.getCurrentProfile();
        if (!currentProfile) {
          console.warn('⚠️ No active profile found, proceeding with evolution without profile validation');
          // Don't throw error, just proceed without profile validation
        } else {
          // Ensure the requesting profile matches the current profile
          if (currentProfile.profileId !== profileId) {
            const hasAccess = await profileIsolationManager.validateProfileAccess(
              currentProfile.profileId,
              profileId,
              'write',
              'breakthroughs'
            );
            
            if (!hasAccess) {
              throw new Error('Insufficient permissions to evolve breakthrough for this profile');
            }
          }
        }

        // Track which profile is running this evolution
        if (!this.profileEvolutions.has(profileId)) {
          this.profileEvolutions.set(profileId, new Set());
        }
        this.profileEvolutions.get(profileId)!.add(blockId);
      }

      // Clean up any existing evolution for this block
      this.stopEvolution(blockId);

      const initialProgress: EvolutionProgress = {
        blockId,
        stage: 'analyzing',
        progress: 0,
        message: EVOLUTION_STAGES[0].message,
        startTime: Date.now()
      };

      this.progressCallbacks.set(blockId, onProgress);
      this.activeEvolutions.set(blockId, initialProgress);
      
      // Start the progress simulation
      this.simulateProgress(blockId);
      
      // Notify initial state
      onProgress(initialProgress);
    } catch (error) {
      console.error('Failed to start evolution with profile validation:', error);
      throw error;
    }
  }

  /**
   * Stop tracking evolution progress for a breakthrough with profile cleanup
   */
  stopEvolution(blockId: string): void {
    const timer = this.timers.get(blockId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(blockId);
    }
    
    // Clean up profile tracking
    for (const [profileId, blockIds] of this.profileEvolutions.entries()) {
      if (blockIds.has(blockId)) {
        blockIds.delete(blockId);
        if (blockIds.size === 0) {
          this.profileEvolutions.delete(profileId);
        }
        break;
      }
    }
    
    this.progressCallbacks.delete(blockId);
    this.activeEvolutions.delete(blockId);
  }

  /**
   * Update progress to next stage with profile validation
   */
  async advanceToStage(blockId: string, stage: EvolutionProgress['stage']): Promise<void> {
    try {
      // Validate that the current profile has permission to advance this evolution
      const currentProfile = profileManager.getCurrentProfile();
      if (currentProfile) {
        const profileId = this.getProfileForEvolution(blockId);
        if (profileId && profileId !== currentProfile.profileId) {
          const hasAccess = await profileIsolationManager.validateProfileAccess(
            currentProfile.profileId,
            profileId,
            'write',
            'breakthroughs'
          );
          
          if (!hasAccess) {
            console.warn(`Profile ${currentProfile.profileId} attempted to advance evolution for ${profileId}`);
            return;
          }
        }
      }

      const progress = this.activeEvolutions.get(blockId);
      const callback = this.progressCallbacks.get(blockId);
      
      if (!progress || !callback) return;

      const stageIndex = EVOLUTION_STAGES.findIndex(s => s.name === stage);
      if (stageIndex === -1) return;

      const stageInfo = EVOLUTION_STAGES[stageIndex];
      const updatedProgress: EvolutionProgress = {
        ...progress,
        stage,
        progress: Math.min(95, (stageIndex + 1) * 25), // Cap at 95% until completion
        message: stageInfo.message,
        estimatedTimeRemaining: this.calculateTimeRemaining(progress.startTime, stageIndex)
      };

      this.activeEvolutions.set(blockId, updatedProgress);
      callback(updatedProgress);
    } catch (error) {
      console.error('Failed to advance evolution stage:', error);
    }
  }

  /**
   * Update progress for a breakthrough (for external progress updates)
   */
  updateProgress(blockId: string, progressData: Partial<EvolutionProgress>): void {
    const progress = this.activeEvolutions.get(blockId);
    const callback = this.progressCallbacks.get(blockId);
    
    if (!progress || !callback) return;

    const updatedProgress: EvolutionProgress = {
      ...progress,
      ...progressData
    };

    this.activeEvolutions.set(blockId, updatedProgress);
    callback(updatedProgress);
  }

  /**
   * Mark evolution as complete
   */
  completeEvolution(blockId: string): void {
    const progress = this.activeEvolutions.get(blockId);
    const callback = this.progressCallbacks.get(blockId);
    
    if (!progress || !callback) return;

    const completedProgress: EvolutionProgress = {
      ...progress,
      stage: 'finalizing',
      progress: 100,
      message: 'Evolution completed successfully!',
      estimatedTimeRemaining: 0
    };

    callback(completedProgress);
    
    // Clean up after a short delay
    setTimeout(() => {
      this.stopEvolution(blockId);
    }, 1000);
  }

  /**
   * Handle evolution error with enhanced error details
   */
  handleEvolutionError(blockId: string, error: string, errorType?: string): void {
    const progress = this.activeEvolutions.get(blockId);
    const callback = this.progressCallbacks.get(blockId);
    
    if (!progress || !callback) return;

    // Create more informative error message
    let errorMessage = `Evolution failed: ${error}`;
    
    // Add specific guidance based on error type
    if (errorType === 'API_KEY_MISSING') {
      errorMessage = 'Evolution failed: API key required - Configure in Settings';
    } else if (errorType === 'NETWORK_CONNECTION') {
      errorMessage = 'Evolution failed: Connection lost - Check internet';
    } else if (errorType === 'RATE_LIMIT_EXCEEDED') {
      errorMessage = 'Evolution failed: Rate limit exceeded - Wait 60s';
    } else if (errorType === 'API_TIMEOUT') {
      errorMessage = 'Evolution failed: Request timed out - Try again';
    }

    const errorProgress: EvolutionProgress = {
      ...progress,
      stage: 'analyzing', // Reset to initial stage
      progress: 0,
      message: errorMessage,
      estimatedTimeRemaining: 0,
      error: true
    };

    callback(errorProgress);
    this.stopEvolution(blockId);
  }

  /**
   * Handle retryable evolution error
   */
  handleRetryableError(blockId: string, error: string, retryDelay: number): void {
    const progress = this.activeEvolutions.get(blockId);
    const callback = this.progressCallbacks.get(blockId);

    if (!progress || !callback) return;

    const retryProgress: EvolutionProgress = {
      ...progress,
      progress: 0,
      message: `${error} - Retrying in ${Math.ceil(retryDelay / 1000)}s...`,
      estimatedTimeRemaining: retryDelay,
      error: false
    };

    callback(retryProgress);
  }

  /**
   * Get current progress for a breakthrough
   */
  getProgress(blockId: string): EvolutionProgress | null {
    return this.activeEvolutions.get(blockId) || null;
  }

  /**
   * Get the profile ID associated with an evolution
   */
  getProfileForEvolution(blockId: string): string | null {
    for (const [profileId, blockIds] of this.profileEvolutions.entries()) {
      if (blockIds.has(blockId)) {
        return profileId;
      }
    }
    return null;
  }

  /**
   * Get all active evolutions for a specific profile
   */
  getProfileEvolutions(profileId: string): string[] {
    const blockIds = this.profileEvolutions.get(profileId);
    return blockIds ? Array.from(blockIds) : [];
  }

  /**
   * Check if evolution is active for a breakthrough
   */
  isEvolutionActive(blockId: string): boolean {
    return this.activeEvolutions.has(blockId);
  }

  /**
   * Validate profile permissions for evolution operations
   */
  async validateEvolutionAccess(blockId: string, operation: 'read' | 'write' | 'cancel'): Promise<boolean> {
    try {
      const currentProfile = profileManager.getCurrentProfile();
      if (!currentProfile) {
        return false;
      }

      const evolutionProfileId = this.getProfileForEvolution(blockId);
      if (!evolutionProfileId) {
        return true; // No profile restriction
      }

      if (currentProfile.profileId === evolutionProfileId) {
        return true; // Same profile, always allowed
      }

      // Check cross-profile access permissions
      return await profileIsolationManager.validateProfileAccess(
        currentProfile.profileId,
        evolutionProfileId,
        operation,
        'breakthroughs'
      );
    } catch (error) {
      console.error('Evolution access validation failed:', error);
      return false;
    }
  }

  /**
   * Simulate realistic progress through stages
   */
  private simulateProgress(blockId: string): void {
    const progress = this.activeEvolutions.get(blockId);
    const callback = this.progressCallbacks.get(blockId);
    
    if (!progress || !callback) return;

    const currentStageIndex = EVOLUTION_STAGES.findIndex(s => s.name === progress.stage);
    if (currentStageIndex === -1) return;

    const currentStage = EVOLUTION_STAGES[currentStageIndex];
    const progressIncrement = 100 / (currentStage.duration / 200); // Update every 200ms
    
    const timer = setTimeout(() => {
      const updatedProgress = this.activeEvolutions.get(blockId);
      if (!updatedProgress) return;

      const newProgress = Math.min(
        (currentStageIndex + 1) * 25 - 1, // Don't exceed stage boundary
        updatedProgress.progress + progressIncrement
      );

      const updated: EvolutionProgress = {
        ...updatedProgress,
        progress: newProgress,
        estimatedTimeRemaining: this.calculateTimeRemaining(updatedProgress.startTime, currentStageIndex)
      };

      this.activeEvolutions.set(blockId, updated);
      callback(updated);

      // Continue simulation if not at stage boundary
      if (newProgress < (currentStageIndex + 1) * 25 - 1) {
        this.simulateProgress(blockId);
      }
    }, 200);

    this.timers.set(blockId, timer);
  }

  /**
   * Calculate estimated time remaining based on stage progress
   */
  private calculateTimeRemaining(startTime: number, currentStageIndex: number): number {
    const elapsed = Date.now() - startTime;
    const totalEstimatedDuration = EVOLUTION_STAGES.reduce((sum, stage) => sum + stage.duration, 0);
    const completedDuration = EVOLUTION_STAGES.slice(0, currentStageIndex).reduce((sum, stage) => sum + stage.duration, 0);
    
    const remaining = Math.max(0, totalEstimatedDuration - elapsed);
    return Math.round(remaining / 1000); // Return in seconds
  }
}

// Export singleton instance
export const evolutionProgressTracker = new EvolutionProgressTracker();