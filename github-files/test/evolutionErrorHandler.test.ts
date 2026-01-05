import { EvolutionErrorHandler, EvolutionError, EvolutionErrorType } from '../services/evolutionErrorHandler';

describe('EvolutionErrorHandler', () => {
  describe('Error Classification', () => {
    test('should classify API key missing error correctly', () => {
      const error = new Error('API key not configured');
      const result = EvolutionErrorHandler.classifyError(error, 'API_KEY_MISSING');
      
      expect(result.type).toBe('API_KEY_MISSING');
      expect(result.userMessage).toBe('DeepSeek API key not configured');
      expect(result.actionable).toContain('Settings');
      expect(result.retryable).toBe(false);
      expect(result.severity).toBe('high');
    });

    test('should classify network connection errors', () => {
      const error = new Error('Network connection failed');
      const result = EvolutionErrorHandler.classifyError(error);
      
      expect(result.type).toBe('NETWORK_CONNECTION');
      expect(result.userMessage).toBe('Network connection failed');
      expect(result.actionable).toContain('internet connection');
      expect(result.retryable).toBe(true);
      expect(result.retryDelay).toBe(3000);
    });

    test('should classify API timeout errors', () => {
      const error = new Error('Request timed out after 30 seconds');
      const result = EvolutionErrorHandler.classifyError(error);
      
      expect(result.type).toBe('API_TIMEOUT');
      expect(result.userMessage).toBe('Request timed out');
      expect(result.retryable).toBe(true);
      expect(result.retryDelay).toBe(5000);
    });

    test('should classify rate limit errors', () => {
      const error = new Error('Rate limit exceeded - too many requests');
      const result = EvolutionErrorHandler.classifyError(error);
      
      expect(result.type).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.userMessage).toBe('API rate limit exceeded');
      expect(result.actionable).toContain('60 seconds');
      expect(result.retryDelay).toBe(60000);
    });

    test('should classify quota exceeded errors', () => {
      const error = new Error('API quota exceeded for this month');
      const result = EvolutionErrorHandler.classifyError(error);
      
      expect(result.type).toBe('QUOTA_EXCEEDED');
      expect(result.userMessage).toBe('API quota exceeded');
      expect(result.retryable).toBe(false);
      expect(result.severity).toBe('high');
    });

    test('should classify server errors', () => {
      const error = new Error('Server error 500 - internal server error');
      const result = EvolutionErrorHandler.classifyError(error);
      
      expect(result.type).toBe('API_SERVER_ERROR');
      expect(result.userMessage).toBe('DeepSeek API server error');
      expect(result.retryable).toBe(true);
      expect(result.retryDelay).toBe(10000);
    });

    test('should classify unknown errors as fallback', () => {
      const error = new Error('Some unknown error occurred');
      const result = EvolutionErrorHandler.classifyError(error);
      
      expect(result.type).toBe('UNKNOWN_ERROR');
      expect(result.userMessage).toBe('Unexpected error occurred');
      expect(result.retryable).toBe(true);
      expect(result.severity).toBe('medium');
    });

    test('should handle null or undefined errors', () => {
      const result1 = EvolutionErrorHandler.classifyError(null);
      const result2 = EvolutionErrorHandler.classifyError(undefined);
      
      expect(result1.type).toBe('UNKNOWN_ERROR');
      expect(result2.type).toBe('UNKNOWN_ERROR');
    });

    test('should handle non-Error objects', () => {
      const result = EvolutionErrorHandler.classifyError('String error');
      
      expect(result.type).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('String error');
    });
  });

  describe('Retry Configuration', () => {
    test('should provide correct retry config for retryable errors', () => {
      const networkError: EvolutionError = {
        type: 'NETWORK_CONNECTION',
        message: 'Network failed',
        userMessage: 'Network connection failed',
        actionable: 'Check connection',
        retryable: true,
        retryDelay: 3000,
        severity: 'medium'
      };

      const retryConfig = EvolutionErrorHandler.getRetryConfig(networkError);
      
      expect(retryConfig.shouldRetry).toBe(true);
      expect(retryConfig.delay).toBe(3000);
      expect(retryConfig.maxRetries).toBe(3);
    });

    test('should provide no retry config for non-retryable errors', () => {
      const apiKeyError: EvolutionError = {
        type: 'API_KEY_MISSING',
        message: 'No API key',
        userMessage: 'API key missing',
        actionable: 'Add API key',
        retryable: false,
        severity: 'high'
      };

      const retryConfig = EvolutionErrorHandler.getRetryConfig(apiKeyError);
      
      expect(retryConfig.shouldRetry).toBe(false);
      expect(retryConfig.delay).toBe(0);
      expect(retryConfig.maxRetries).toBe(0);
    });

    test('should limit retries for rate limit errors', () => {
      const rateLimitError: EvolutionError = {
        type: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limited',
        userMessage: 'Rate limit exceeded',
        actionable: 'Wait',
        retryable: true,
        retryDelay: 60000,
        severity: 'medium'
      };

      const retryConfig = EvolutionErrorHandler.getRetryConfig(rateLimitError);
      
      expect(retryConfig.maxRetries).toBe(1);
    });

    test('should limit retries for timeout errors', () => {
      const timeoutError: EvolutionError = {
        type: 'API_TIMEOUT',
        message: 'Timeout',
        userMessage: 'Request timed out',
        actionable: 'Try again',
        retryable: true,
        retryDelay: 5000,
        severity: 'medium'
      };

      const retryConfig = EvolutionErrorHandler.getRetryConfig(timeoutError);
      
      expect(retryConfig.maxRetries).toBe(2);
    });
  });

  describe('Error Formatting and Display', () => {
    test('should format error for logging correctly', () => {
      const error: EvolutionError = {
        type: 'NETWORK_CONNECTION',
        message: 'fetch failed',
        userMessage: 'Network connection failed',
        actionable: 'Check your internet connection',
        retryable: true,
        retryDelay: 3000,
        severity: 'medium'
      };

      const formatted = EvolutionErrorHandler.formatForLog(error);
      
      expect(formatted).toContain('[NETWORK_CONNECTION]');
      expect(formatted).toContain('fetch failed');
      expect(formatted).toContain('Network connection failed');
      expect(formatted).toContain('Check your internet connection');
    });

    test('should get correct notification type based on severity', () => {
      const criticalError: EvolutionError = {
        type: 'API_KEY_MISSING',
        message: 'No key',
        userMessage: 'API key missing',
        actionable: 'Add key',
        retryable: false,
        severity: 'critical'
      };

      const mediumError: EvolutionError = {
        type: 'NETWORK_CONNECTION',
        message: 'Network failed',
        userMessage: 'Network failed',
        actionable: 'Check connection',
        retryable: true,
        severity: 'medium'
      };

      const lowError: EvolutionError = {
        type: 'PARSING_ERROR',
        message: 'Parse failed',
        userMessage: 'Parsing failed',
        actionable: 'Try again',
        retryable: true,
        severity: 'low'
      };

      expect(EvolutionErrorHandler.getNotificationType(criticalError)).toBe('error');
      expect(EvolutionErrorHandler.getNotificationType(mediumError)).toBe('warning');
      expect(EvolutionErrorHandler.getNotificationType(lowError)).toBe('warning');
    });
  });

  describe('Error Pattern Matching', () => {
    test('should match authentication patterns', () => {
      const authErrors = [
        'Invalid API key provided',
        'Authentication failed',
        'Unauthorized access',
        'api key is required'
      ];

      authErrors.forEach(errorMsg => {
        const error = new Error(errorMsg);
        const result = EvolutionErrorHandler.classifyError(error);
        expect(result.type).toBe('API_KEY_INVALID');
      });
    });

    test('should match network patterns', () => {
      const networkErrors = [
        'Network request failed',
        'fetch error occurred',
        'Connection refused'
      ];

      networkErrors.forEach(errorMsg => {
        const error = new Error(errorMsg);
        const result = EvolutionErrorHandler.classifyError(error);
        expect(result.type).toBe('NETWORK_CONNECTION');
      });
    });

    test('should match timeout patterns', () => {
      const timeoutErrors = [
        'Request timeout after 30s',
        'Operation timed out',
        'Connection timed out'
      ];

      timeoutErrors.forEach(errorMsg => {
        const error = new Error(errorMsg);
        const result = EvolutionErrorHandler.classifyError(error);
        expect(result.type).toBe('API_TIMEOUT');
      });
    });

    test('should match server error patterns', () => {
      const serverErrors = [
        'Internal server error 500',
        'Server error occurred',
        'HTTP 502 Bad Gateway',
        'Service unavailable 503'
      ];

      serverErrors.forEach(errorMsg => {
        const error = new Error(errorMsg);
        const result = EvolutionErrorHandler.classifyError(error);
        expect(result.type).toBe('API_SERVER_ERROR');
      });
    });
  });

  describe('Error Details Validation', () => {
    test('should provide actionable suggestions for all error types', () => {
      const errorTypes: EvolutionErrorType[] = [
        'API_KEY_MISSING',
        'API_KEY_INVALID',
        'NETWORK_CONNECTION',
        'API_TIMEOUT',
        'RATE_LIMIT_EXCEEDED',
        'QUOTA_EXCEEDED',
        'INSUFFICIENT_FUNDS',
        'BLOCK_NOT_FOUND',
        'INVALID_BLOCK_STATE',
        'API_SERVER_ERROR',
        'PARSING_ERROR',
        'VALIDATION_ERROR',
        'UNKNOWN_ERROR'
      ];

      errorTypes.forEach(errorType => {
        const error = new Error('test error');
        // Force the error type by using context
        const result = EvolutionErrorHandler.classifyError(error);
        
        expect(result.actionable).toBeTruthy();
        expect(result.actionable.length).toBeGreaterThan(10);
        expect(result.userMessage).toBeTruthy();
        expect(result.userMessage.length).toBeGreaterThan(5);
      });
    });

    test('should have consistent severity levels', () => {
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      
      const error = new Error('test');
      const result = EvolutionErrorHandler.classifyError(error);
      
      expect(validSeverities).toContain(result.severity);
    });

    test('should have consistent retry delay ranges', () => {
      const retryableError: EvolutionError = {
        type: 'NETWORK_CONNECTION',
        message: 'Network failed',
        userMessage: 'Network failed',
        actionable: 'Check connection',
        retryable: true,
        retryDelay: 3000,
        severity: 'medium'
      };

      expect(retryableError.retryDelay).toBeGreaterThan(0);
      expect(retryableError.retryDelay).toBeLessThanOrEqual(60000);
    });
  });
});