/**
 * Enhanced error handling system for breakthrough evolution
 * Provides specific error types, user-friendly messages, and actionable suggestions
 */

export interface EvolutionError {
  type: EvolutionErrorType;
  message: string;
  userMessage: string;
  actionable: string;
  retryable: boolean;
  retryDelay?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type EvolutionErrorType = 
  | 'API_KEY_MISSING'
  | 'API_KEY_INVALID'
  | 'NETWORK_CONNECTION'
  | 'API_TIMEOUT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'QUOTA_EXCEEDED'
  | 'INSUFFICIENT_FUNDS'
  | 'BLOCK_NOT_FOUND'
  | 'INVALID_BLOCK_STATE'
  | 'API_SERVER_ERROR'
  | 'PARSING_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

export class EvolutionErrorHandler {
  private static readonly ERROR_PATTERNS: Record<string, EvolutionErrorType> = {
    'API key': 'API_KEY_INVALID',
    'api key': 'API_KEY_INVALID',
    'authentication': 'API_KEY_INVALID',
    'unauthorized': 'API_KEY_INVALID',
    'network': 'NETWORK_CONNECTION',
    'fetch': 'NETWORK_CONNECTION',
    'connection': 'NETWORK_CONNECTION',
    'timeout': 'API_TIMEOUT',
    'timed out': 'API_TIMEOUT',
    'rate limit': 'RATE_LIMIT_EXCEEDED',
    'too many requests': 'RATE_LIMIT_EXCEEDED',
    'quota': 'QUOTA_EXCEEDED',
    'limit exceeded': 'QUOTA_EXCEEDED',
    'insufficient': 'INSUFFICIENT_FUNDS',
    'not found': 'BLOCK_NOT_FOUND',
    'server error': 'API_SERVER_ERROR',
    '500': 'API_SERVER_ERROR',
    '502': 'API_SERVER_ERROR',
    '503': 'API_SERVER_ERROR',
    'parse': 'PARSING_ERROR',
    'json': 'PARSING_ERROR',
    'validation': 'VALIDATION_ERROR',
    'invalid': 'VALIDATION_ERROR'
  };

  /**
   * Classify error based on error message and context
   */
  static classifyError(error: any, context?: string): EvolutionError {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const lowerMessage = errorMessage.toLowerCase();
    
    // Check for specific error patterns
    let errorType: EvolutionErrorType = 'UNKNOWN_ERROR';
    
    for (const [pattern, type] of Object.entries(this.ERROR_PATTERNS)) {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        errorType = type;
        break;
      }
    }

    // Special case: Check if API key is missing from context
    if (context === 'API_KEY_MISSING') {
      errorType = 'API_KEY_MISSING';
    }

    return this.createErrorDetails(errorType, errorMessage);
  }

  /**
   * Create detailed error information with user-friendly messages and actions
   */
  private static createErrorDetails(type: EvolutionErrorType, originalMessage: string): EvolutionError {
    const errorDetails: Record<EvolutionErrorType, Omit<EvolutionError, 'type' | 'message'>> = {
      API_KEY_MISSING: {
        userMessage: "DeepSeek API key not configured",
        actionable: "Please add your DeepSeek API key in Settings → API Configuration",
        retryable: false,
        severity: 'high'
      },
      API_KEY_INVALID: {
        userMessage: "Invalid or expired API key",
        actionable: "Please verify your DeepSeek API key in Settings and ensure it's active",
        retryable: false,
        severity: 'high'
      },
      NETWORK_CONNECTION: {
        userMessage: "Network connection failed",
        actionable: "Check your internet connection and try again",
        retryable: true,
        retryDelay: 3000,
        severity: 'medium'
      },
      API_TIMEOUT: {
        userMessage: "Request timed out",
        actionable: "The DeepSeek API is experiencing high load. Please wait a moment and try again",
        retryable: true,
        retryDelay: 5000,
        severity: 'medium'
      },
      RATE_LIMIT_EXCEEDED: {
        userMessage: "API rate limit exceeded",
        actionable: "You've made too many requests. Please wait 60 seconds before trying again",
        retryable: true,
        retryDelay: 60000,
        severity: 'medium'
      },
      QUOTA_EXCEEDED: {
        userMessage: "API quota exceeded",
        actionable: "Your DeepSeek API quota has been exceeded. Check your account limits or upgrade your plan",
        retryable: false,
        severity: 'high'
      },
      INSUFFICIENT_FUNDS: {
        userMessage: "Insufficient QRK balance",
        actionable: "You need at least 25 QRK to evolve a breakthrough. Mine more blocks to earn QRK",
        retryable: false,
        severity: 'medium'
      },
      BLOCK_NOT_FOUND: {
        userMessage: "Breakthrough block not found",
        actionable: "The selected breakthrough block could not be located. Please refresh and try again",
        retryable: false,
        severity: 'low'
      },
      INVALID_BLOCK_STATE: {
        userMessage: "Invalid breakthrough state",
        actionable: "The breakthrough block is in an invalid state. Please contact support if this persists",
        retryable: false,
        severity: 'medium'
      },
      API_SERVER_ERROR: {
        userMessage: "DeepSeek API server error",
        actionable: "The DeepSeek API is experiencing issues. Please try again in a few minutes",
        retryable: true,
        retryDelay: 10000,
        severity: 'medium'
      },
      PARSING_ERROR: {
        userMessage: "Response parsing failed",
        actionable: "Received invalid response from DeepSeek API. Please try again",
        retryable: true,
        retryDelay: 2000,
        severity: 'low'
      },
      VALIDATION_ERROR: {
        userMessage: "Data validation failed",
        actionable: "The breakthrough data failed validation. Please ensure all fields are properly filled",
        retryable: false,
        severity: 'medium'
      },
      UNKNOWN_ERROR: {
        userMessage: "Unexpected error occurred",
        actionable: "An unknown error occurred. Please try again or contact support if the issue persists",
        retryable: true,
        retryDelay: 3000,
        severity: 'medium'
      }
    };

    const details = errorDetails[type];
    return {
      type,
      message: originalMessage,
      ...details
    };
  }

  /**
   * Get retry configuration for an error
   */
  static getRetryConfig(error: EvolutionError): { shouldRetry: boolean; delay: number; maxRetries: number } {
    if (!error.retryable) {
      return { shouldRetry: false, delay: 0, maxRetries: 0 };
    }

    const baseDelay = error.retryDelay || 3000;
    let maxRetries = 3;

    // Adjust retry attempts based on error type
    switch (error.type) {
      case 'RATE_LIMIT_EXCEEDED':
        maxRetries = 1; // Only retry once after rate limit
        break;
      case 'API_TIMEOUT':
        maxRetries = 2; // Limited retries for timeouts
        break;
      case 'NETWORK_CONNECTION':
        maxRetries = 3; // More retries for network issues
        break;
      default:
        maxRetries = 2;
    }

    return {
      shouldRetry: true,
      delay: baseDelay,
      maxRetries
    };
  }

  /**
   * Format error for logging
   */
  static formatForLog(error: EvolutionError): string {
    return `[${error.type}] ${error.message} | User: ${error.userMessage} | Action: ${error.actionable}`;
  }

  /**
   * Get notification type based on error severity
   */
  static getNotificationType(error: EvolutionError): 'error' | 'warning' | 'info' {
    switch (error.severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'warning';
    }
  }
}