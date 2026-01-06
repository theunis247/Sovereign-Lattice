import { deepSeekClient, DeepSeekClient, MiningEvaluationRequest, MiningEvaluationResponse, EvolutionRequest, EvolutionResponse, ProgressCallback } from './deepSeekClient';
import { apiKeyManager } from './apiKeyManager';

export interface DeepSeekServiceStatus {
  isAvailable: boolean;
  isConfigured: boolean;
  hasValidKey: boolean;
  lastError?: string;
  fallbackMode: boolean;
  features: {
    miningEvaluation: boolean;
    breakthroughEvolution: boolean;
    apiKeyValidation: boolean;
  };
}

export interface FallbackEvaluationResponse extends MiningEvaluationResponse {
  isFallback: true;
  fallbackReason: string;
}

export interface FallbackEvolutionResponse extends EvolutionResponse {
  isFallback: true;
  fallbackReason: string;
}

export interface SafeDeepSeekNotification {
  type: 'info' | 'warning' | 'error' | 'fallback';
  title: string;
  message: string;
  action?: {
    label: string;
    callback: () => void;
  };
}

export type NotificationCallback = (notification: SafeDeepSeekNotification) => void;

/**
 * Safe DeepSeek Client with comprehensive error boundaries and fallback mechanisms
 * Provides graceful degradation when DeepSeek API is unavailable
 */
export class SafeDeepSeekClient {
  private client: DeepSeekClient;
  private status: DeepSeekServiceStatus;
  private notificationCallback?: NotificationCallback;
  private initializationPromise?: Promise<void>;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.client = deepSeekClient;
    this.status = {
      isAvailable: false,
      isConfigured: false,
      hasValidKey: false,
      fallbackMode: true,
      features: {
        miningEvaluation: false,
        breakthroughEvolution: false,
        apiKeyValidation: false
      }
    };
  }

  /**
   * Set notification callback for user feedback
   */
  public setNotificationCallback(callback: NotificationCallback): void {
    this.notificationCallback = callback;
  }

  /**
   * Initialize the DeepSeek service with comprehensive error handling
   */
  public async initialize(): Promise<DeepSeekServiceStatus> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      return this.status;
    }

    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
    return this.status;
  }

  /**
   * Perform the actual initialization with error boundaries
   */
  private async performInitialization(): Promise<void> {
    try {
      // Reset status
      this.status = {
        isAvailable: false,
        isConfigured: false,
        hasValidKey: false,
        fallbackMode: true,
        features: {
          miningEvaluation: false,
          breakthroughEvolution: false,
          apiKeyValidation: false
        }
      };

      // Check if API key is configured
      const isConfigured = await this.safeCheck(() => this.client.isConfigured());
      this.status.isConfigured = isConfigured;

      if (!isConfigured) {
        this.notifyUser({
          type: 'warning',
          title: 'AI Features Limited',
          message: 'DeepSeek API key not configured. Mining will use basic evaluation.',
          action: {
            label: 'Configure API Key',
            callback: () => {
              // This would typically open settings
              console.log('Open API key configuration');
            }
          }
        });
        return;
      }

      // Test API connection
      const connectionValid = await this.safeCheck(() => this.client.testConnection());
      this.status.hasValidKey = connectionValid;

      if (!connectionValid) {
        this.status.lastError = 'API key validation failed';
        this.notifyUser({
          type: 'error',
          title: 'API Key Invalid',
          message: 'DeepSeek API key is invalid or expired. Please update your API key.',
          action: {
            label: 'Update API Key',
            callback: () => {
              console.log('Open API key update');
            }
          }
        });
        return;
      }

      // If we reach here, DeepSeek is fully available
      this.status.isAvailable = true;
      this.status.fallbackMode = false;
      this.status.features = {
        miningEvaluation: true,
        breakthroughEvolution: true,
        apiKeyValidation: true
      };

      this.notifyUser({
        type: 'info',
        title: 'AI Features Active',
        message: 'DeepSeek API is connected and ready for breakthrough evaluation.'
      });

      } catch (error: any) {
        this.status.lastError = error.message || 'Unknown initialization error';
        this.status.fallbackMode = true;
      
      this.notifyUser({
        type: 'error',
        title: 'AI Service Error',
        message: 'Failed to initialize DeepSeek API. Using fallback evaluation system.',
        action: {
          label: 'Retry',
          callback: () => this.reinitialize()
        }
      });
    }
  }

  /**
   * Reinitialize the service (for retry scenarios)
   */
  public async reinitialize(): Promise<DeepSeekServiceStatus> {
    this.initializationPromise = undefined;
    return this.initialize();
  }

  /**
   * Safely execute a function with error boundaries
   */
  private async safeCheck<T>(operation: () => Promise<T>): Promise<T | false> {
    try {
      return await operation();
    } catch (error) {
      console.warn('Safe check failed:', error);
      return false;
    }
  }

  /**
   * Get current service status
   */
  public getStatus(): DeepSeekServiceStatus {
    return { ...this.status };
  }

  /**
   * Check if service needs health check
   */
  private needsHealthCheck(): boolean {
    return Date.now() - this.lastHealthCheck > this.healthCheckInterval;
  }

  /**
   * Perform health check if needed
   */
  private async performHealthCheckIfNeeded(): Promise<void> {
    if (!this.needsHealthCheck()) {
      return;
    }

    this.lastHealthCheck = Date.now();
    
    if (this.status.isAvailable) {
      const isStillValid = await this.safeCheck(() => this.client.testConnection());
      if (!isStillValid) {
        this.status.isAvailable = false;
        this.status.fallbackMode = true;
        this.status.lastError = 'Health check failed - API connection lost';
        
        this.notifyUser({
          type: 'warning',
          title: 'AI Connection Lost',
          message: 'DeepSeek API connection lost. Switching to fallback mode.',
          action: {
            label: 'Reconnect',
            callback: () => this.reinitialize()
          }
        });
      }
    }
  }

  /**
   * Evaluate mining breakthrough with fallback
   */
  public async evaluateMiningBreakthrough(
    request: MiningEvaluationRequest,
    progressCallback?: ProgressCallback
  ): Promise<MiningEvaluationResponse | FallbackEvaluationResponse> {
    await this.initialize();
    await this.performHealthCheckIfNeeded();

    if (!this.status.isAvailable || this.status.fallbackMode) {
      return this.generateFallbackEvaluation(request);
    }

    try {
      progressCallback?.({ stage: 'api_init', message: 'Connecting to DeepSeek API...' });
      return await this.client.evaluateMiningBreakthrough(request, progressCallback);
    } catch (error: any) {
      console.warn('DeepSeek evaluation failed, using fallback:', error);
      
      // Update status to indicate API issues
      this.status.fallbackMode = true;
      this.status.lastError = error.message;
      
      this.notifyUser({
        type: 'fallback',
        title: 'Using Fallback Evaluation',
        message: 'DeepSeek API temporarily unavailable. Using local evaluation system.'
      });

      return this.generateFallbackEvaluation(request, error.message);
    }
  }

  /**
   * Evolve breakthrough with fallback
   */
  public async evolveBreakthrough(
    request: EvolutionRequest,
    progressCallback?: ProgressCallback
  ): Promise<EvolutionResponse | FallbackEvolutionResponse> {
    await this.initialize();
    await this.performHealthCheckIfNeeded();

    if (!this.status.isAvailable || this.status.fallbackMode) {
      return this.generateFallbackEvolution(request);
    }

    try {
      progressCallback?.({ stage: 'api_init', message: 'Connecting to DeepSeek API...' });
      return await this.client.evolveBreakthrough(request, progressCallback);
    } catch (error: any) {
      console.warn('DeepSeek evolution failed, using fallback:', error);
      
      // Update status to indicate API issues
      this.status.fallbackMode = true;
      this.status.lastError = error.message;
      
      this.notifyUser({
        type: 'fallback',
        title: 'Using Fallback Evolution',
        message: 'DeepSeek API temporarily unavailable. Using simplified evolution system.'
      });

      return this.generateFallbackEvolution(request, error.message);
    }
  }

  /**
   * Generate fallback mining evaluation
   */
  private generateFallbackEvaluation(
    request: MiningEvaluationRequest,
    errorReason?: string
  ): FallbackEvaluationResponse {
    // Simple heuristic-based evaluation
    const problemLength = request.problem.length;
    const hasFormula = /[=∫∂∇∆∑∏]/g.test(request.problem);
    const hasConstants = /[π𝜋ℏħ𝑐𝐺𝑘]/g.test(request.problem) || /planck|speed.*light|gravity|boltzmann/i.test(request.problem);
    const hasComplexMath = /\b(quantum|relativity|entropy|eigenvalue|hamiltonian|lagrangian)\b/i.test(request.problem);

    let grade: 'S' | 'A' | 'B' | 'C' = 'C';
    let score = 1.0;

    if (hasComplexMath && hasFormula && hasConstants && problemLength > 200) {
      grade = 'A';
      score = 4.0;
    } else if ((hasFormula && hasConstants) || (hasComplexMath && problemLength > 100)) {
      grade = 'B';
      score = 2.0;
    } else if (problemLength > 50) {
      grade = 'C';
      score = 1.0;
    }

    return {
      grade,
      breakthroughScore: score,
      explanation: `Fallback evaluation based on content analysis. Problem demonstrates ${grade === 'A' ? 'advanced' : grade === 'B' ? 'intermediate' : 'basic'} scientific concepts.`,
      consensusCritique: `Local evaluation system detected ${hasFormula ? 'mathematical formulation' : 'conceptual discussion'}. ${hasConstants ? 'Physical constants identified.' : 'Consider adding quantitative elements.'} Full peer review requires DeepSeek API connection.`,
      primaryFormula: hasFormula ? "E = mc²" : "F = ma",
      observedConstants: hasConstants ? { "c": "299792458 m/s", "ℏ": "1.054571817×10⁻³⁴ J⋅s" } : { "g": "9.81 m/s²" },
      neuralInterpretation: `Fallback analysis suggests ${grade.toLowerCase()}-tier scientific contribution. Connect DeepSeek API for comprehensive evaluation.`,
      isFallback: true,
      fallbackReason: errorReason || 'DeepSeek API not available'
    };
  }

  /**
   * Generate fallback evolution response
   */
  private generateFallbackEvolution(
    request: EvolutionRequest,
    errorReason?: string
  ): FallbackEvolutionResponse {
    // Simple evolution based on current level
    const newLevel = request.currentLevel + 1;
    const baseGrade = request.currentExplanation.length > 200 ? 'B' : 'C';
    
    return {
      newGrade: baseGrade,
      newScore: baseGrade === 'B' ? 2.0 : 1.0,
      evolvedExplanation: `${request.currentExplanation}\n\n[Mk ${newLevel} Evolution]: Enhanced theoretical framework with expanded mathematical foundation. Full evolution analysis requires DeepSeek API connection.`,
      scientificMath: `Mathematical progression to Mk ${newLevel} level. Advanced formulation pending full API analysis.`,
      evolvedFormula: `Ψ_{${newLevel}}(x,t) = Ψ_{${request.currentLevel}}(x,t) ⊗ H_{evolution}`,
      observedConstants: { "ℏ": "1.054571817×10⁻³⁴ J⋅s", "c": "299792458 m/s" },
      realWorldImplementation: `Mk ${newLevel} applications in theoretical physics and quantum mechanics. Detailed implementation requires comprehensive API evaluation.`,
      consensusCritique: `Advancement Council fallback system approves progression to Mk ${newLevel}. Connect DeepSeek API for full peer review and detailed evolution analysis.`,
      isFallback: true,
      fallbackReason: errorReason || 'DeepSeek API not available'
    };
  }

  /**
   * Test API connection with error handling
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.initialize();
      if (!this.status.isAvailable) {
        return false;
      }
      return await this.client.testConnection();
    } catch (error) {
      console.warn('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Check if API is configured
   */
  public async isConfigured(): Promise<boolean> {
    try {
      return await this.client.isConfigured();
    } catch (error) {
      console.warn('Configuration check failed:', error);
      return false;
    }
  }

  /**
   * Send notification to user
   */
  private notifyUser(notification: SafeDeepSeekNotification): void {
    if (this.notificationCallback) {
      this.notificationCallback(notification);
    } else {
      // Fallback to console logging
      console.log(`[SafeDeepSeek] ${notification.type.toUpperCase()}: ${notification.title} - ${notification.message}`);
    }
  }

  /**
   * Get feature availability
   */
  public getFeatureAvailability(): {
    miningEvaluation: boolean;
    breakthroughEvolution: boolean;
    apiKeyValidation: boolean;
    fallbackMode: boolean;
  } {
    return {
      ...this.status.features,
      fallbackMode: this.status.fallbackMode
    };
  }

  /**
   * Force fallback mode (for testing or emergency scenarios)
   */
  public forceFallbackMode(reason: string = 'Manual override'): void {
    this.status.fallbackMode = true;
    this.status.isAvailable = false;
    this.status.lastError = reason;
    
    this.notifyUser({
      type: 'warning',
      title: 'Fallback Mode Activated',
      message: `AI features disabled: ${reason}`
    });
  }

  /**
   * Get diagnostic information
   */
  public getDiagnostics(): {
    status: DeepSeekServiceStatus;
    lastHealthCheck: number;
    initializationComplete: boolean;
  } {
    return {
      status: this.getStatus(),
      lastHealthCheck: this.lastHealthCheck,
      initializationComplete: this.initializationPromise !== undefined
    };
  }
}

// Singleton instance
export const safeDeepSeekClient = new SafeDeepSeekClient();