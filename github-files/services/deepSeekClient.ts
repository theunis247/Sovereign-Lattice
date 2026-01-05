import { apiKeyManager, DeepSeekConfig } from './apiKeyManager';

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: 'json_object';
  };
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface MiningEvaluationRequest {
  problem: string;
  currentLevel?: number;
}

export interface MiningEvaluationResponse {
  grade: 'S' | 'A' | 'B' | 'C';
  breakthroughScore: number;
  explanation: string;
  consensusCritique: string;
  primaryFormula: string;
  observedConstants: Record<string, string>;
  neuralInterpretation: string;
}

export interface EvolutionRequest {
  currentExplanation: string;
  currentLevel: number;
  blockId: string;
}

export interface EvolutionResponse {
  newGrade: 'S' | 'A' | 'B' | 'C';
  newScore: number;
  evolvedExplanation: string;
  scientificMath: string;
  evolvedFormula: string;
  observedConstants: Record<string, string>;
  realWorldImplementation: string;
  consensusCritique: string;
}

// Progress callback type for API operations
export type ProgressCallback = (progress: { stage: string; message: string; progress?: number }) => void;

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  timeoutMs: number;
}

/**
 * DeepSeek API Client for scientific breakthrough evaluation
 */
export class DeepSeekClient {
  private config: DeepSeekConfig | null = null;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    timeoutMs: 30000
  };

  constructor() {
    this.initializeConfig();
  }

  private async initializeConfig(): Promise<void> {
    try {
      this.config = await apiKeyManager.getDeepSeekConfig();
    } catch (error) {
      console.error('Failed to initialize DeepSeek config:', error);
    }
  }

  /**
   * Ensure configuration is loaded
   */
  private async ensureConfig(): Promise<DeepSeekConfig> {
    if (!this.config) {
      this.config = await apiKeyManager.getDeepSeekConfig();
    }

    if (!this.config) {
      throw new Error('No DeepSeek API key configured. Please add your API key in settings.');
    }

    return this.config;
  }

  /**
   * Make a request to DeepSeek API with timeout and retry logic
   */
  private async makeRequest(request: DeepSeekRequest, progressCallback?: ProgressCallback): Promise<DeepSeekResponse> {
    const config = await this.ensureConfig();

    return this.makeRequestWithRetry(request, config, progressCallback, 0);
  }

  /**
   * Make request with retry logic
   */
  private async makeRequestWithRetry(
    request: DeepSeekRequest, 
    config: DeepSeekConfig, 
    progressCallback?: ProgressCallback,
    attempt: number = 0
  ): Promise<DeepSeekResponse> {
    try {
      progressCallback?.({ 
        stage: 'api_call', 
        message: `Connecting to DeepSeek API (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1})...` 
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.retryConfig.timeoutMs);

      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...request,
          model: config.model
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `DeepSeek API error: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // Use default error message if parsing fails
        }

        // Check if this is a retryable error
        if (this.isRetryableError(response.status) && attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, attempt),
            this.retryConfig.maxDelay
          );
          
          progressCallback?.({ 
            stage: 'retry', 
            message: `Request failed (${response.status}). Retrying in ${delay/1000}s...` 
          });
          
          await this.sleep(delay);
          return this.makeRequestWithRetry(request, config, progressCallback, attempt + 1);
        }

        // Throw specific error types for better handling
        if (response.status === 401 || response.status === 403) {
          throw new Error(`API authentication failed: ${errorMessage}`);
        } else if (response.status === 429) {
          throw new Error(`Rate limit exceeded: ${errorMessage}`);
        } else if (response.status >= 500) {
          throw new Error(`Server error (${response.status}): ${errorMessage}`);
        } else {
          throw new Error(`API error (${response.status}): ${errorMessage}`);
        }
      }

      progressCallback?.({ 
        stage: 'processing', 
        message: 'Processing DeepSeek response...' 
      });

      return await response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (attempt < this.retryConfig.maxRetries) {
          progressCallback?.({ 
            stage: 'retry', 
            message: `Request timed out. Retrying...` 
          });
          
          await this.sleep(this.retryConfig.baseDelay);
          return this.makeRequestWithRetry(request, config, progressCallback, attempt + 1);
        }
        throw new Error(`Request timed out after ${this.retryConfig.timeoutMs/1000} seconds`);
      }

      // Network errors are retryable
      if ((error.message?.includes('fetch') || error.message?.includes('network')) && attempt < this.retryConfig.maxRetries) {
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt),
          this.retryConfig.maxDelay
        );
        
        progressCallback?.({ 
          stage: 'retry', 
          message: `Network error. Retrying in ${delay/1000}s...` 
        });
        
        await this.sleep(delay);
        return this.makeRequestWithRetry(request, config, progressCallback, attempt + 1);
      }

      // Enhance error message for better classification
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout: Operation timed out after ${this.retryConfig.timeoutMs/1000} seconds`);
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        throw new Error(`Network connection failed: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * Check if an HTTP status code indicates a retryable error
   */
  private isRetryableError(status: number): boolean {
    return status >= 500 || status === 429 || status === 408;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate structured content with JSON response
   */
  public async generateStructuredContent<T>(
    prompt: string,
    schema?: any,
    temperature: number = 0.7,
    progressCallback?: ProgressCallback
  ): Promise<T> {
    progressCallback?.({ 
      stage: 'preparing', 
      message: 'Preparing request for DeepSeek API...' 
    });

    const messages: DeepSeekMessage[] = [
      {
        role: 'user',
        content: prompt
      }
    ];

    const request: DeepSeekRequest = {
      model: 'deepseek-chat', // Will be overridden by config
      messages,
      temperature,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    };

    const response = await this.makeRequest(request, progressCallback);
    
    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response from DeepSeek API');
    }

    progressCallback?.({ 
      stage: 'parsing', 
      message: 'Parsing response data...' 
    });

    const content = response.choices[0].message.content;
    
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error.message}`);
    }
  }

  /**
   * Evaluate a mining breakthrough
   */
  public async evaluateMiningBreakthrough(
    request: MiningEvaluationRequest, 
    progressCallback?: ProgressCallback
  ): Promise<MiningEvaluationResponse> {
    progressCallback?.({ 
      stage: 'analyzing', 
      message: 'Analyzing breakthrough for peer review...' 
    });

    const prompt = `You are a Skeptical Scientific Reviewer. Review this discovery: "${request.problem}".

SCORING RUBRIC:
- Grade C: Speculative science, common knowledge, or lacks mathematical rigor. (1.0x Quarks)
- Grade B: Valid scientific logic, includes some specific physical or mathematical constants. (2.0x Quarks)
- Grade A: Nobel-level theoretical work, includes complex LaTeX formulas or proofs. (5.0x Quarks)
- Grade S: IMPOSSIBLE BREAKTHROUGH (e.g. Time Travel Proof, Faster-than-light math). EXTREMELY RARE. (10x Quarks + 0.005 QBS).

MANDATORY: Provide a "primaryFormula" in LaTeX style and a set of "observedConstants" (e.g. Planck, Speed of Light).
Only give S if the explanation is truly "unimagineable" but framed with absolute mathematical certainty. Reject speculative talk as C.

Return JSON with the following structure:
{
  "grade": "S|A|B|C",
  "breakthroughScore": number,
  "explanation": "detailed explanation",
  "consensusCritique": "peer review critique",
  "primaryFormula": "LaTeX formula",
  "observedConstants": {"constant_name": "value"},
  "neuralInterpretation": "interpretation"
}`;

    return await this.generateStructuredContent<MiningEvaluationResponse>(prompt, null, 0.3, progressCallback);
  }

  /**
   * Evolve a breakthrough to the next level
   */
  public async evolveBreakthrough(
    request: EvolutionRequest, 
    progressCallback?: ProgressCallback
  ): Promise<EvolutionResponse> {
    progressCallback?.({ 
      stage: 'synthesizing', 
      message: 'Submitting breakthrough to Advancement Council...' 
    });

    const prompt = `You are a Harsh Advancement Council. Evolve this scientific breakthrough: "${request.currentExplanation}".
Current Tier: Mk ${request.currentLevel}.
If the user has not provided enough theoretical foundation in previous steps, REJECT evolution or give a low score.
Award S-Grade ONLY for perfect mathematical logic that resolves a major universal paradox.

MANDATORY: Return an "evolvedFormula" and a "scientificMath" block for high-fidelity UI rendering.

Return JSON with the following structure:
{
  "newGrade": "S|A|B|C",
  "newScore": number,
  "evolvedExplanation": "evolved explanation",
  "scientificMath": "mathematical details",
  "evolvedFormula": "LaTeX formula",
  "observedConstants": {"constant_name": "value"},
  "realWorldImplementation": "practical applications",
  "consensusCritique": "council critique"
}`;

    return await this.generateStructuredContent<EvolutionResponse>(prompt, null, 0.4, progressCallback);
  }

  /**
   * Test API key validity
   */
  public async testConnection(): Promise<boolean> {
    try {
      const config = await this.ensureConfig();
      
      const response = await fetch(`${config.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('DeepSeek connection test failed:', error);
      return false;
    }
  }

  /**
   * Check if API key is configured
   */
  public async isConfigured(): Promise<boolean> {
    try {
      const config = await apiKeyManager.getDeepSeekConfig();
      return config !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get usage information (if available)
   */
  public getLastUsage(): { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null {
    // This would be populated from the last API response
    // For now, return null as we don't store usage data
    return null;
  }
}

// Singleton instance
export const deepSeekClient = new DeepSeekClient();