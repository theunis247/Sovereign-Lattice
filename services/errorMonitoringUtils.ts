/**
 * Error Monitoring Utilities
 * Helper functions and utilities for error monitoring integration
 */

import { errorMonitoringIntegration, ErrorContext } from './errorMonitoringIntegration';

/**
 * Error monitoring decorator for functions
 * Automatically logs errors and provides context
 */
export function withErrorMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  context: {
    component: string;
    operation: string;
    category?: 'auth' | 'evolution' | 'pdf' | 'database' | 'network' | 'system' | 'user';
  }
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          logErrorByCategory(error, context);
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      logErrorByCategory(error, context);
      throw error;
    }
  }) as T;
}

/**
 * Async error monitoring decorator
 */
export function withAsyncErrorMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: {
    component: string;
    operation: string;
    category?: 'auth' | 'evolution' | 'pdf' | 'database' | 'network' | 'system' | 'user';
  }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logErrorByCategory(error, context);
      throw error;
    }
  }) as T;
}

/**
 * Log error based on category with appropriate handler
 */
function logErrorByCategory(
  error: any,
  context: {
    component: string;
    operation: string;
    category?: 'auth' | 'evolution' | 'pdf' | 'database' | 'network' | 'system' | 'user';
  }
): string {
  const errorContext: ErrorContext = {
    operation: context.operation,
    component: context.component,
    additionalData: { originalContext: context }
  };

  switch (context.category) {
    case 'auth':
      return errorMonitoringIntegration.logAuthError(error, errorContext).then(result => result.errorId).catch(() => '');
    case 'evolution':
      return errorMonitoringIntegration.logEvolutionError(error, errorContext).errorId;
    case 'pdf':
      return errorMonitoringIntegration.logPDFError(error, errorContext).errorId;
    case 'database':
      return errorMonitoringIntegration.logDatabaseError(error, context.operation, errorContext);
    case 'network':
      return errorMonitoringIntegration.logNetworkError(error, undefined, errorContext);
    case 'user':
      return errorMonitoringIntegration.logUserError(error, context.operation, errorContext);
    case 'system':
    default:
      return errorMonitoringIntegration.logSystemError(error, context.component, errorContext);
  }
}

/**
 * Performance monitoring wrapper
 * Tracks function execution time and logs performance issues
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  context: {
    component: string;
    operation: string;
    warningThreshold?: number; // milliseconds
    errorThreshold?: number; // milliseconds
  }
): T {
  return ((...args: Parameters<T>) => {
    const startTime = performance.now();
    
    const logPerformance = (duration: number) => {
      const { warningThreshold = 1000, errorThreshold = 5000 } = context;
      
      if (duration > errorThreshold) {
        errorMonitoringIntegration.logSystemError(
          `Performance error: ${context.operation} took ${duration.toFixed(2)}ms`,
          context.component,
          {
            operation: context.operation,
            component: context.component,
            additionalData: { 
              duration,
              threshold: errorThreshold,
              performanceIssue: true
            }
          }
        );
      } else if (duration > warningThreshold) {
        console.warn(`Performance warning: ${context.operation} took ${duration.toFixed(2)}ms`);
      }
    };
    
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - startTime;
          logPerformance(duration);
        });
      }
      
      const duration = performance.now() - startTime;
      logPerformance(duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logPerformance(duration);
      throw error;
    }
  }) as T;
}

/**
 * Create error boundary for React components
 */
export class ErrorMonitoringBoundary extends React.Component<
  { children: React.ReactNode; component: string },
  { hasError: boolean; errorId?: string }
> {
  constructor(props: { children: React.ReactNode; component: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = errorMonitoringIntegration.logSystemError(
      error,
      this.props.component,
      {
        operation: 'component_render',
        component: this.props.component,
        additionalData: {
          errorInfo,
          componentStack: errorInfo.componentStack,
          errorBoundary: true
        }
      }
    );
    
    this.setState({ errorId });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <h3 className="text-red-800 font-semibold mb-2">Component Error</h3>
          <p className="text-red-700 text-sm mb-2">
            The {this.props.component} component encountered an error and has been temporarily disabled.
          </p>
          {this.state.errorId && (
            <p className="text-red-600 text-xs">
              Error ID: {this.state.errorId}
            </p>
          )}
          <button
            onClick={() => this.setState({ hasError: false, errorId: undefined })}
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for error monitoring in React components
 */
export function useErrorMonitoring(component: string) {
  const logError = React.useCallback((
    error: Error | string,
    operation: string,
    category: 'auth' | 'evolution' | 'pdf' | 'database' | 'network' | 'system' | 'user' = 'system'
  ) => {
    return logErrorByCategory(error, { component, operation, category });
  }, [component]);

  const logUserAction = React.useCallback((action: string, error?: Error | string) => {
    if (error) {
      return errorMonitoringIntegration.logUserError(error, action, {
        component,
        operation: action
      });
    }
  }, [component]);

  const withErrorHandling = React.useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    operation: string,
    category: 'auth' | 'evolution' | 'pdf' | 'database' | 'network' | 'system' | 'user' = 'system'
  ) => {
    return withErrorMonitoring(fn, { component, operation, category });
  }, [component]);

  return {
    logError,
    logUserAction,
    withErrorHandling
  };
}

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandling() {
  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      errorMonitoringIntegration.logSystemError(
        event.reason || 'Unhandled promise rejection',
        'global',
        {
          operation: 'unhandled_promise_rejection',
          component: 'global',
          additionalData: {
            promise: event.promise,
            reason: event.reason,
            globalError: true
          }
        }
      );
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      errorMonitoringIntegration.logSystemError(
        event.error || event.message,
        'global',
        {
          operation: 'uncaught_error',
          component: 'global',
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            message: event.message,
            globalError: true
          }
        }
      );
    });
  }
}

/**
 * Network request error monitoring wrapper
 */
export async function monitoredFetch(
  url: string,
  options?: RequestInit,
  context?: { component?: string; operation?: string }
): Promise<Response> {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const duration = performance.now() - startTime;
      errorMonitoringIntegration.logNetworkError(
        `HTTP ${response.status}: ${response.statusText}`,
        url,
        {
          operation: context?.operation || 'fetch',
          component: context?.component || 'network',
          additionalData: {
            url,
            status: response.status,
            statusText: response.statusText,
            duration,
            method: options?.method || 'GET'
          }
        }
      );
    }
    
    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    errorMonitoringIntegration.logNetworkError(
      error,
      url,
      {
        operation: context?.operation || 'fetch',
        component: context?.component || 'network',
        additionalData: {
          url,
          duration,
          method: options?.method || 'GET',
          networkError: true
        }
      }
    );
    throw error;
  }
}

/**
 * Database operation error monitoring wrapper
 */
export async function monitoredDatabaseOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: { component?: string }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    errorMonitoringIntegration.logDatabaseError(
      error,
      operation,
      {
        operation,
        component: context?.component || 'database',
        additionalData: {
          databaseOperation: operation
        }
      }
    );
    throw error;
  }
}

/**
 * User action tracking with error monitoring
 */
export function trackUserAction(
  action: string,
  component: string,
  additionalData?: Record<string, any>
) {
  try {
    // Log successful user action (info level)
    console.info(`User action: ${action} in ${component}`, additionalData);
  } catch (error) {
    errorMonitoringIntegration.logUserError(
      error,
      action,
      {
        operation: action,
        component,
        additionalData
      }
    );
  }
}

// React import for ErrorMonitoringBoundary
import React from 'react';