/**
 * Error Monitoring Integration Service
 * Integrates production error monitoring with existing error handlers
 * and provides unified error tracking across the application
 */

import { productionErrorMonitor, ProductionError } from './productionErrorMonitor';
import { AuthError, authErrorHandler } from './authErrorHandler';
import { EvolutionError, EvolutionErrorHandler } from './evolutionErrorHandler';
import { PDFError, PDFErrorHandler } from './pdfErrorHandler';

export interface ErrorContext {
  operation?: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

/**
 * Unified Error Monitoring Integration
 * Provides a single interface for error logging across all application components
 */
export class ErrorMonitoringIntegration {
  private static instance: ErrorMonitoringIntegration;

  public static getInstance(): ErrorMonitoringIntegration {
    if (!ErrorMonitoringIntegration.instance) {
      ErrorMonitoringIntegration.instance = new ErrorMonitoringIntegration();
    }
    return ErrorMonitoringIntegration.instance;
  }

  /**
   * Log authentication error with production monitoring
   */
  public async logAuthError(
    error: Error | string,
    context: ErrorContext = {}
  ): Promise<{ authError: AuthError; errorId: string }> {
    // Process with auth error handler
    const sessionId = context.sessionId || authErrorHandler.startDiagnosticSession(
      context.operation || 'authentication',
      context.userId
    );
    
    const authError = await authErrorHandler.handleAuthError(error, context.additionalData || {}, sessionId);
    
    // Log to production monitoring
    const errorId = productionErrorMonitor.logError(
      this.mapSeverityToLevel(authError.severity),
      'auth',
      authError.code,
      authError.message,
      {
        ...context,
        authErrorType: authError.type,
        recoverable: authError.recoverable,
        recoveryActions: authError.recoveryActions,
        technicalDetails: authError.technicalDetails
      },
      authError.userMessage,
      typeof error === 'object' ? error : new Error(error)
    );

    // End diagnostic session
    authErrorHandler.endDiagnosticSession(sessionId, false);

    return { authError, errorId };
  }

  /**
   * Log evolution/breakthrough error with production monitoring
   */
  public logEvolutionError(
    error: any,
    context: ErrorContext = {}
  ): { evolutionError: EvolutionError; errorId: string } {
    // Process with evolution error handler
    const evolutionError = EvolutionErrorHandler.classifyError(error, context.additionalData?.apiContext);
    
    // Log to production monitoring
    const errorId = productionErrorMonitor.logError(
      this.mapSeverityToLevel(evolutionError.severity),
      'evolution',
      evolutionError.type,
      evolutionError.message,
      {
        ...context,
        retryable: evolutionError.retryable,
        retryDelay: evolutionError.retryDelay,
        actionable: evolutionError.actionable
      },
      evolutionError.userMessage,
      typeof error === 'object' ? error : new Error(error)
    );

    return { evolutionError, errorId };
  }

  /**
   * Log PDF generation error with production monitoring
   */
  public logPDFError(
    error: any,
    context: ErrorContext = {}
  ): { pdfError: PDFError; errorId: string } {
    // Process with PDF error handler
    const pdfError = PDFErrorHandler.classifyError(error, context.additionalData?.pdfContext);
    
    // Log to production monitoring
    const errorId = productionErrorMonitor.logError(
      this.mapSeverityToLevel(pdfError.severity),
      'pdf',
      pdfError.type,
      pdfError.message,
      {
        ...context,
        retryable: pdfError.retryable,
        fallbackAvailable: pdfError.fallbackAvailable,
        actionable: pdfError.actionable
      },
      pdfError.userMessage,
      typeof error === 'object' ? error : new Error(error)
    );

    return { pdfError, errorId };
  }

  /**
   * Log database error with production monitoring
   */
  public logDatabaseError(
    error: Error | string,
    operation: string,
    context: ErrorContext = {}
  ): string {
    const message = typeof error === 'string' ? error : error.message;
    
    // Determine error severity based on operation and message
    const severity = this.determineDatabaseErrorSeverity(message, operation);
    
    return productionErrorMonitor.logError(
      severity,
      'database',
      this.getDatabaseErrorCode(message),
      message,
      {
        ...context,
        operation,
        databaseOperation: operation
      },
      this.getDatabaseUserMessage(message, operation),
      typeof error === 'object' ? error : new Error(error)
    );
  }

  /**
   * Log network error with production monitoring
   */
  public logNetworkError(
    error: Error | string,
    endpoint?: string,
    context: ErrorContext = {}
  ): string {
    const message = typeof error === 'string' ? error : error.message;
    
    return productionErrorMonitor.logError(
      'error',
      'network',
      this.getNetworkErrorCode(message),
      message,
      {
        ...context,
        endpoint,
        networkEndpoint: endpoint
      },
      this.getNetworkUserMessage(message),
      typeof error === 'object' ? error : new Error(error)
    );
  }

  /**
   * Log system error with production monitoring
   */
  public logSystemError(
    error: Error | string,
    component: string,
    context: ErrorContext = {}
  ): string {
    const message = typeof error === 'string' ? error : error.message;
    
    return productionErrorMonitor.logError(
      'error',
      'system',
      this.getSystemErrorCode(message, component),
      message,
      {
        ...context,
        component,
        systemComponent: component
      },
      this.getSystemUserMessage(message, component),
      typeof error === 'object' ? error : new Error(error)
    );
  }

  /**
   * Log user action error with production monitoring
   */
  public logUserError(
    error: Error | string,
    action: string,
    context: ErrorContext = {}
  ): string {
    const message = typeof error === 'string' ? error : error.message;
    
    return productionErrorMonitor.logError(
      'warn',
      'user',
      this.getUserErrorCode(action),
      message,
      {
        ...context,
        action,
        userAction: action
      },
      this.getUserErrorMessage(message, action),
      typeof error === 'object' ? error : new Error(error)
    );
  }

  /**
   * Mark error as resolved
   */
  public resolveError(errorId: string, resolutionMethod: string): boolean {
    return productionErrorMonitor.resolveError(errorId, resolutionMethod);
  }

  /**
   * Get system health status
   */
  public getSystemHealth() {
    return productionErrorMonitor.getSystemHealth();
  }

  /**
   * Generate diagnostic report
   */
  public generateDiagnosticReport(timeRange?: { start: string; end: string }) {
    return productionErrorMonitor.generateDiagnosticReport(timeRange);
  }

  /**
   * Get error patterns for analysis
   */
  public getErrorPatterns(category?: string, timeRange?: { start: string; end: string }) {
    return productionErrorMonitor.getErrorPatterns(category, timeRange);
  }

  /**
   * Export error data
   */
  public exportErrorData(format: 'json' | 'csv', timeRange?: { start: string; end: string }) {
    return productionErrorMonitor.exportErrorData(format, timeRange);
  }

  // Private helper methods

  private mapSeverityToLevel(severity: string): ProductionError['level'] {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
      default:
        return 'info';
    }
  }

  private determineDatabaseErrorSeverity(message: string, operation: string): ProductionError['level'] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('corruption') || lowerMessage.includes('fatal')) {
      return 'critical';
    }
    
    if (lowerMessage.includes('connection') || lowerMessage.includes('timeout')) {
      return 'error';
    }
    
    if (operation.includes('write') || operation.includes('update') || operation.includes('delete')) {
      return 'error';
    }
    
    return 'warn';
  }

  private getDatabaseErrorCode(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('connection')) return 'DB_CONNECTION_FAILED';
    if (lowerMessage.includes('timeout')) return 'DB_TIMEOUT';
    if (lowerMessage.includes('not found')) return 'DB_RECORD_NOT_FOUND';
    if (lowerMessage.includes('constraint')) return 'DB_CONSTRAINT_VIOLATION';
    if (lowerMessage.includes('corruption')) return 'DB_CORRUPTION';
    if (lowerMessage.includes('permission')) return 'DB_PERMISSION_DENIED';
    if (lowerMessage.includes('lock')) return 'DB_LOCK_TIMEOUT';
    
    return 'DB_UNKNOWN_ERROR';
  }

  private getDatabaseUserMessage(message: string, operation: string): string {
    const code = this.getDatabaseErrorCode(message);
    
    switch (code) {
      case 'DB_CONNECTION_FAILED':
        return 'Database connection failed. Please try again in a moment.';
      case 'DB_TIMEOUT':
        return 'Database operation timed out. Please try again.';
      case 'DB_RECORD_NOT_FOUND':
        return 'Requested data not found. Please refresh and try again.';
      case 'DB_CONSTRAINT_VIOLATION':
        return 'Data validation failed. Please check your input and try again.';
      case 'DB_CORRUPTION':
        return 'Data integrity issue detected. Please contact support.';
      case 'DB_PERMISSION_DENIED':
        return 'Access denied. Please check your permissions.';
      case 'DB_LOCK_TIMEOUT':
        return 'Database is busy. Please try again in a moment.';
      default:
        return `Database ${operation} failed. Please try again or contact support.`;
    }
  }

  private getNetworkErrorCode(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('timeout')) return 'NETWORK_TIMEOUT';
    if (lowerMessage.includes('connection')) return 'NETWORK_CONNECTION_FAILED';
    if (lowerMessage.includes('dns')) return 'NETWORK_DNS_ERROR';
    if (lowerMessage.includes('cors')) return 'NETWORK_CORS_ERROR';
    if (lowerMessage.includes('404')) return 'NETWORK_NOT_FOUND';
    if (lowerMessage.includes('500')) return 'NETWORK_SERVER_ERROR';
    if (lowerMessage.includes('403')) return 'NETWORK_FORBIDDEN';
    if (lowerMessage.includes('401')) return 'NETWORK_UNAUTHORIZED';
    
    return 'NETWORK_UNKNOWN_ERROR';
  }

  private getNetworkUserMessage(message: string): string {
    const code = this.getNetworkErrorCode(message);
    
    switch (code) {
      case 'NETWORK_TIMEOUT':
        return 'Request timed out. Please check your connection and try again.';
      case 'NETWORK_CONNECTION_FAILED':
        return 'Connection failed. Please check your internet connection.';
      case 'NETWORK_DNS_ERROR':
        return 'Unable to reach server. Please check your connection.';
      case 'NETWORK_CORS_ERROR':
        return 'Cross-origin request blocked. Please contact support.';
      case 'NETWORK_NOT_FOUND':
        return 'Requested resource not found.';
      case 'NETWORK_SERVER_ERROR':
        return 'Server error occurred. Please try again later.';
      case 'NETWORK_FORBIDDEN':
        return 'Access forbidden. Please check your permissions.';
      case 'NETWORK_UNAUTHORIZED':
        return 'Authentication required. Please log in again.';
      default:
        return 'Network error occurred. Please check your connection and try again.';
    }
  }

  private getSystemErrorCode(message: string, component: string): string {
    const lowerMessage = message.toLowerCase();
    const componentPrefix = component.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    
    if (lowerMessage.includes('memory')) return `${componentPrefix}_MEMORY_ERROR`;
    if (lowerMessage.includes('initialization')) return `${componentPrefix}_INIT_ERROR`;
    if (lowerMessage.includes('configuration')) return `${componentPrefix}_CONFIG_ERROR`;
    if (lowerMessage.includes('permission')) return `${componentPrefix}_PERMISSION_ERROR`;
    if (lowerMessage.includes('not supported')) return `${componentPrefix}_UNSUPPORTED`;
    
    return `${componentPrefix}_SYSTEM_ERROR`;
  }

  private getSystemUserMessage(message: string, component: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('memory')) {
      return 'System memory issue detected. Please close other applications and try again.';
    }
    if (lowerMessage.includes('initialization')) {
      return `${component} failed to initialize. Please refresh the page and try again.`;
    }
    if (lowerMessage.includes('configuration')) {
      return `${component} configuration error. Using safe defaults.`;
    }
    if (lowerMessage.includes('permission')) {
      return `Permission denied for ${component}. Please check your browser settings.`;
    }
    if (lowerMessage.includes('not supported')) {
      return `${component} is not supported in this browser. Please use a modern browser.`;
    }
    
    return `${component} encountered an error. Please try again or contact support.`;
  }

  private getUserErrorCode(action: string): string {
    const actionCode = action.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    return `USER_${actionCode}_ERROR`;
  }

  private getUserErrorMessage(message: string, action: string): string {
    return `Unable to complete ${action}. Please try again or contact support if the issue persists.`;
  }
}

// Export singleton instance
export const errorMonitoringIntegration = ErrorMonitoringIntegration.getInstance();

// Convenience functions for common error logging
export const logAuthError = (error: Error | string, context?: ErrorContext) => 
  errorMonitoringIntegration.logAuthError(error, context);

export const logEvolutionError = (error: any, context?: ErrorContext) => 
  errorMonitoringIntegration.logEvolutionError(error, context);

export const logPDFError = (error: any, context?: ErrorContext) => 
  errorMonitoringIntegration.logPDFError(error, context);

export const logDatabaseError = (error: Error | string, operation: string, context?: ErrorContext) => 
  errorMonitoringIntegration.logDatabaseError(error, operation, context);

export const logNetworkError = (error: Error | string, endpoint?: string, context?: ErrorContext) => 
  errorMonitoringIntegration.logNetworkError(error, endpoint, context);

export const logSystemError = (error: Error | string, component: string, context?: ErrorContext) => 
  errorMonitoringIntegration.logSystemError(error, component, context);

export const logUserError = (error: Error | string, action: string, context?: ErrorContext) => 
  errorMonitoringIntegration.logUserError(error, action, context);