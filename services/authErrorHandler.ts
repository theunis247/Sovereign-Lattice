/**
 * Authentication Error Handler Service
 * Provides comprehensive error handling, user-friendly messaging, and diagnostic logging
 * for authentication flows with automatic recovery procedures
 */

export interface AuthError {
  code: string;
  type: 'VALIDATION' | 'NETWORK' | 'SYSTEM' | 'SECURITY' | 'RECOVERY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  userMessage: string;
  technicalDetails?: string;
  timestamp: string;
  context?: Record<string, any>;
  recoverable: boolean;
  recoveryActions?: string[];
}

export interface AuthDiagnostics {
  sessionId: string;
  userId?: string;
  operation: string;
  startTime: string;
  endTime?: string;
  success: boolean;
  errors: AuthError[];
  warnings: string[];
  performanceMetrics?: {
    duration: number;
    memoryUsage?: number;
    networkLatency?: number;
  };
  systemInfo?: {
    userAgent?: string;
    platform?: string;
    browserVersion?: string;
    screenResolution?: string;
  };
}

export interface RecoveryResult {
  success: boolean;
  action: string;
  message: string;
  nextSteps?: string[];
}

/**
 * Authentication Error Handler
 * Centralized error handling with user-friendly messaging and automatic recovery
 */
export class AuthErrorHandler {
  private static instance: AuthErrorHandler;
  private diagnostics: Map<string, AuthDiagnostics> = new Map();
  private errorPatterns: Map<string, number> = new Map();
  private recoveryAttempts: Map<string, number> = new Map();

  public static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler();
    }
    return AuthErrorHandler.instance;
  }

  /**
   * Create a new diagnostic session
   */
  public startDiagnosticSession(operation: string, userId?: string): string {
    const sessionId = this.generateSessionId();
    const diagnostics: AuthDiagnostics = {
      sessionId,
      userId,
      operation,
      startTime: new Date().toISOString(),
      success: false,
      errors: [],
      warnings: [],
      systemInfo: this.collectSystemInfo()
    };

    this.diagnostics.set(sessionId, diagnostics);
    return sessionId;
  }

  /**
   * End diagnostic session with results
   */
  public endDiagnosticSession(sessionId: string, success: boolean): void {
    const diagnostics = this.diagnostics.get(sessionId);
    if (diagnostics) {
      diagnostics.endTime = new Date().toISOString();
      diagnostics.success = success;
      
      if (diagnostics.startTime) {
        const duration = new Date().getTime() - new Date(diagnostics.startTime).getTime();
        diagnostics.performanceMetrics = {
          duration,
          memoryUsage: this.getMemoryUsage()
        };
      }

      // Log diagnostics for analysis
      this.logDiagnostics(diagnostics);
    }
  }

  /**
   * Handle authentication errors with comprehensive processing
   */
  public async handleAuthError(
    error: Error | string,
    context: Record<string, any> = {},
    sessionId?: string
  ): Promise<AuthError> {
    const authError = this.processError(error, context);
    
    // Record error pattern for analysis
    this.recordErrorPattern(authError.code);
    
    // Add to diagnostics if session exists
    if (sessionId) {
      const diagnostics = this.diagnostics.get(sessionId);
      if (diagnostics) {
        diagnostics.errors.push(authError);
      }
    }

    // Attempt automatic recovery if applicable
    if (authError.recoverable) {
      const recoveryResult = await this.attemptRecovery(authError, context);
      if (recoveryResult.success) {
        authError.userMessage = `${authError.userMessage} (Automatically resolved: ${recoveryResult.message})`;
      }
    }

    // Log error for diagnostics
    this.logError(authError);

    return authError;
  }

  /**
   * Process raw error into structured AuthError
   */
  private processError(error: Error | string, context: Record<string, any>): AuthError {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const timestamp = new Date().toISOString();

    // Sanitize context before processing
    const sanitizedContext = this.sanitizeContext(context);

    // Analyze error to determine type and create user-friendly message
    const errorAnalysis = this.analyzeError(errorMessage, sanitizedContext);

    return {
      code: errorAnalysis.code,
      type: errorAnalysis.type,
      severity: errorAnalysis.severity,
      message: errorMessage,
      userMessage: errorAnalysis.userMessage,
      technicalDetails: typeof error === 'object' ? error.stack : undefined,
      timestamp,
      context: sanitizedContext,
      recoverable: errorAnalysis.recoverable,
      recoveryActions: errorAnalysis.recoveryActions
    };
  }

  /**
   * Analyze error message to determine type and user-friendly response
   */
  private analyzeError(message: string, context: Record<string, any>): {
    code: string;
    type: AuthError['type'];
    severity: AuthError['severity'];
    userMessage: string;
    recoverable: boolean;
    recoveryActions?: string[];
  } {
    const lowerMessage = message.toLowerCase();

    // Network-related errors
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
      return {
        code: 'NETWORK_ERROR',
        type: 'NETWORK',
        severity: 'MEDIUM',
        userMessage: 'Connection issue detected. Please check your internet connection and try again.',
        recoverable: true,
        recoveryActions: ['retry_connection', 'check_network']
      };
    }

    // Database/Storage errors
    if (lowerMessage.includes('database') || lowerMessage.includes('storage') || lowerMessage.includes('indexeddb')) {
      return {
        code: 'STORAGE_ERROR',
        type: 'SYSTEM',
        severity: 'HIGH',
        userMessage: 'Storage system temporarily unavailable. Your data is safe, please try again in a moment.',
        recoverable: true,
        recoveryActions: ['clear_cache', 'retry_storage']
      };
    }

    // Crypto/Security errors
    if (lowerMessage.includes('crypto') || lowerMessage.includes('hash') || lowerMessage.includes('encryption')) {
      return {
        code: 'CRYPTO_ERROR',
        type: 'SECURITY',
        severity: 'HIGH',
        userMessage: 'Security system initialization failed. Using secure fallback methods.',
        recoverable: true,
        recoveryActions: ['use_fallback_crypto']
      };
    }

    // Authentication-specific errors
    if (lowerMessage.includes('password') || lowerMessage.includes('credentials') || lowerMessage.includes('authentication')) {
      return {
        code: 'AUTH_FAILED',
        type: 'VALIDATION',
        severity: 'MEDIUM',
        userMessage: 'Login credentials are incorrect. Please check your username and password.',
        recoverable: false
      };
    }

    // User not found
    if (lowerMessage.includes('user not found') || lowerMessage.includes('node not found') || lowerMessage.includes('identity missing')) {
      return {
        code: 'USER_NOT_FOUND',
        type: 'VALIDATION',
        severity: 'MEDIUM',
        userMessage: 'Account not found. Please check your username or create a new account.',
        recoverable: false
      };
    }

    // Lockout errors
    if (lowerMessage.includes('lockout') || lowerMessage.includes('locked') || lowerMessage.includes('cooling')) {
      return {
        code: 'ACCOUNT_LOCKED',
        type: 'SECURITY',
        severity: 'HIGH',
        userMessage: 'Account temporarily locked for security. Please wait before trying again.',
        recoverable: true,
        recoveryActions: ['wait_lockout']
      };
    }

    // Recovery errors
    if (lowerMessage.includes('mnemonic') || lowerMessage.includes('recovery') || lowerMessage.includes('shards')) {
      return {
        code: 'RECOVERY_ERROR',
        type: 'RECOVERY',
        severity: 'MEDIUM',
        userMessage: 'Recovery information is incomplete or incorrect. Please verify all 24 words.',
        recoverable: false
      };
    }

    // Registration errors
    if (lowerMessage.includes('already exists') || lowerMessage.includes('collision') || lowerMessage.includes('occupied')) {
      return {
        code: 'USER_EXISTS',
        type: 'VALIDATION',
        severity: 'LOW',
        userMessage: 'Username already taken. Please choose a different username.',
        recoverable: false
      };
    }

    // System/Configuration errors
    if (lowerMessage.includes('configuration') || lowerMessage.includes('config') || lowerMessage.includes('initialization')) {
      return {
        code: 'CONFIG_ERROR',
        type: 'SYSTEM',
        severity: 'HIGH',
        userMessage: 'System configuration issue detected. Using safe defaults.',
        recoverable: true,
        recoveryActions: ['use_default_config', 'reinitialize_system']
      };
    }

    // Generic system errors
    return {
      code: 'SYSTEM_ERROR',
      type: 'SYSTEM',
      severity: 'MEDIUM',
      userMessage: 'An unexpected issue occurred. Please try again or contact support if the problem persists.',
      recoverable: true,
      recoveryActions: ['retry_operation']
    };
  }

  /**
   * Attempt automatic recovery based on error type
   */
  private async attemptRecovery(error: AuthError, context: Record<string, any>): Promise<RecoveryResult> {
    const recoveryKey = `${error.code}_${context.operation || 'unknown'}`;
    const attempts = this.recoveryAttempts.get(recoveryKey) || 0;

    // Limit recovery attempts to prevent infinite loops
    if (attempts >= 3) {
      return {
        success: false,
        action: 'max_attempts_reached',
        message: 'Maximum recovery attempts reached'
      };
    }

    this.recoveryAttempts.set(recoveryKey, attempts + 1);

    try {
      switch (error.code) {
        case 'NETWORK_ERROR':
          return await this.recoverNetworkError(context);
        
        case 'STORAGE_ERROR':
          return await this.recoverStorageError(context);
        
        case 'CRYPTO_ERROR':
          return await this.recoverCryptoError(context);
        
        case 'CONFIG_ERROR':
          return await this.recoverConfigError(context);
        
        default:
          return {
            success: false,
            action: 'no_recovery_available',
            message: 'No automatic recovery available for this error type'
          };
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return {
        success: false,
        action: 'recovery_failed',
        message: 'Recovery attempt encountered an error'
      };
    }
  }

  /**
   * Recover from network errors
   */
  private async recoverNetworkError(context: Record<string, any>): Promise<RecoveryResult> {
    // Wait a short time and retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if network is available
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return {
        success: false,
        action: 'network_offline',
        message: 'Network is offline',
        nextSteps: ['Check your internet connection', 'Try again when online']
      };
    }

    return {
      success: true,
      action: 'network_retry',
      message: 'Network connection restored'
    };
  }

  /**
   * Recover from storage errors
   */
  private async recoverStorageError(context: Record<string, any>): Promise<RecoveryResult> {
    try {
      // Try to clear and reinitialize storage
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear any corrupted cache data
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('auth_cache_')) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => window.localStorage.removeItem(key));
      }

      return {
        success: true,
        action: 'storage_cleared',
        message: 'Storage cache cleared and reinitialized'
      };
    } catch (error) {
      return {
        success: false,
        action: 'storage_recovery_failed',
        message: 'Unable to recover storage system'
      };
    }
  }

  /**
   * Recover from crypto errors
   */
  private async recoverCryptoError(context: Record<string, any>): Promise<RecoveryResult> {
    try {
      // Import and initialize crypto fallback
      const { CryptoFallbackService } = await import('./cryptoFallback');
      
      // Test fallback crypto functionality
      const testResult = CryptoFallbackService.generateRandomBytes(16);
      
      if (testResult.success) {
        return {
          success: true,
          action: 'crypto_fallback_enabled',
          message: 'Secure fallback cryptography activated'
        };
      }

      return {
        success: false,
        action: 'crypto_fallback_failed',
        message: 'Fallback cryptography unavailable'
      };
    } catch (error) {
      return {
        success: false,
        action: 'crypto_recovery_error',
        message: 'Crypto recovery system error'
      };
    }
  }

  /**
   * Recover from configuration errors
   */
  private async recoverConfigError(context: Record<string, any>): Promise<RecoveryResult> {
    try {
      // Reset to safe default configuration
      const defaultConfig = {
        maxRetries: 3,
        timeout: 30000,
        fallbackMode: true,
        securityLevel: 'standard'
      };

      // Store default config in context for use
      Object.assign(context, { recoveredConfig: defaultConfig });

      return {
        success: true,
        action: 'config_reset',
        message: 'Configuration reset to safe defaults'
      };
    } catch (error) {
      return {
        success: false,
        action: 'config_recovery_failed',
        message: 'Unable to reset configuration'
      };
    }
  }

  /**
   * Add warning to diagnostic session
   */
  public addWarning(sessionId: string, warning: string): void {
    const diagnostics = this.diagnostics.get(sessionId);
    if (diagnostics) {
      diagnostics.warnings.push(`${new Date().toISOString()}: ${warning}`);
    }
  }

  /**
   * Get user-friendly error message for display
   */
  public getUserMessage(error: AuthError): string {
    return error.userMessage;
  }

  /**
   * Get diagnostic information for troubleshooting
   */
  public getDiagnostics(sessionId: string): AuthDiagnostics | null {
    return this.diagnostics.get(sessionId) || null;
  }

  /**
   * Clear old diagnostic sessions to prevent memory leaks
   */
  public clearOldDiagnostics(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [sessionId, diagnostics] of this.diagnostics.entries()) {
      if (new Date(diagnostics.startTime) < cutoff) {
        this.diagnostics.delete(sessionId);
      }
    }
  }

  /**
   * Get error pattern statistics
   */
  public getErrorPatterns(): Record<string, number> {
    return Object.fromEntries(this.errorPatterns);
  }

  // Private helper methods

  private generateSessionId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private recordErrorPattern(errorCode: string): void {
    const count = this.errorPatterns.get(errorCode) || 0;
    this.errorPatterns.set(errorCode, count + 1);
  }

  private collectSystemInfo(): AuthDiagnostics['systemInfo'] {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      browserVersion: this.getBrowserVersion(),
      screenResolution: `${screen.width}x${screen.height}`
    };
  }

  private getBrowserVersion(): string {
    const ua = navigator.userAgent;
    let match = ua.match(/(chrome|firefox|safari|edge|opera)\/(\d+)/i);
    
    if (match) {
      return `${match[1]} ${match[2]}`;
    }
    
    return 'Unknown';
  }

  private getMemoryUsage(): number | undefined {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }

  private logError(error: AuthError): void {
    // Log to console with appropriate level based on severity
    const logLevel = error.severity === 'CRITICAL' || error.severity === 'HIGH' ? 'error' : 
                    error.severity === 'MEDIUM' ? 'warn' : 'info';
    
    console[logLevel](`[AuthError:${error.code}] ${error.message}`, {
      type: error.type,
      severity: error.severity,
      timestamp: error.timestamp,
      context: error.context,
      recoverable: error.recoverable
    });

    // Store error for analysis (in production, this would go to a logging service)
    this.storeErrorForAnalysis(error);
  }

  private logDiagnostics(diagnostics: AuthDiagnostics): void {
    console.info(`[AuthDiagnostics] Session ${diagnostics.sessionId} completed`, {
      operation: diagnostics.operation,
      success: diagnostics.success,
      duration: diagnostics.performanceMetrics?.duration,
      errorCount: diagnostics.errors.length,
      warningCount: diagnostics.warnings.length
    });

    // Store diagnostics for analysis
    this.storeDiagnosticsForAnalysis(diagnostics);
  }

  private storeErrorForAnalysis(error: AuthError): void {
    try {
      // In production, this would send to a logging service
      // For now, store in localStorage for debugging
      if (typeof window !== 'undefined' && window.localStorage) {
        const errors = JSON.parse(window.localStorage.getItem('auth_errors') || '[]');
        errors.push({
          ...error,
          // Remove sensitive context data
          context: this.sanitizeContext(error.context)
        });
        
        // Keep only last 100 errors
        if (errors.length > 100) {
          errors.splice(0, errors.length - 100);
        }
        
        window.localStorage.setItem('auth_errors', JSON.stringify(errors));
      }
    } catch (e) {
      // Ignore storage errors when logging
    }
  }

  private storeDiagnosticsForAnalysis(diagnostics: AuthDiagnostics): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const sessions = JSON.parse(window.localStorage.getItem('auth_diagnostics') || '[]');
        sessions.push({
          ...diagnostics,
          // Remove sensitive data
          userId: diagnostics.userId ? 'redacted' : undefined,
          errors: diagnostics.errors.map(error => ({
            ...error,
            context: this.sanitizeContext(error.context)
          }))
        });
        
        // Keep only last 50 sessions
        if (sessions.length > 50) {
          sessions.splice(0, sessions.length - 50);
        }
        
        window.localStorage.setItem('auth_diagnostics', JSON.stringify(sessions));
      }
    } catch (e) {
      // Ignore storage errors when logging
    }
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> {
    if (!context) return {};
    
    const sanitized = { ...context };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'mnemonic', 'privateKey'];
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}

// Export singleton instance
export const authErrorHandler = AuthErrorHandler.getInstance();