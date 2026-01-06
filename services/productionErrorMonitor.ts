/**
 * Production Environment Error Monitoring System
 * Comprehensive error logging, diagnostic collection, and pattern analysis
 * with secure handling of sensitive data
 */

export interface ProductionError {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  category: 'auth' | 'evolution' | 'pdf' | 'database' | 'network' | 'system' | 'user';
  code: string;
  message: string;
  userMessage?: string;
  stack?: string;
  context: Record<string, any>;
  sessionId?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  resolved: boolean;
  resolutionTime?: string;
  resolutionMethod?: string;
}

export interface ErrorPattern {
  code: string;
  category: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  frequency: number; // errors per hour
  affectedUsers: Set<string>;
  commonContext: Record<string, any>;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface DiagnosticReport {
  reportId: string;
  timestamp: string;
  timeRange: {
    start: string;
    end: string;
  };
  summary: {
    totalErrors: number;
    criticalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsByLevel: Record<string, number>;
    uniqueUsers: number;
    resolutionRate: number;
  };
  topErrors: ErrorPattern[];
  systemHealth: {
    errorRate: number;
    averageResolutionTime: number;
    userImpact: number;
  };
  recommendations: string[];
}

export interface MonitoringConfig {
  maxErrorsInMemory: number;
  maxPatternsTracked: number;
  reportGenerationInterval: number; // milliseconds
  errorRetentionDays: number;
  sensitiveFields: string[];
  logLevels: ('info' | 'warn' | 'error' | 'critical')[];
  enableRemoteLogging: boolean;
  remoteEndpoint?: string;
}

/**
 * Production Error Monitoring Service
 * Centralized error tracking, pattern analysis, and diagnostic reporting
 */
export class ProductionErrorMonitor {
  private static instance: ProductionErrorMonitor;
  private errors: Map<string, ProductionError> = new Map();
  private patterns: Map<string, ErrorPattern> = new Map();
  private config: MonitoringConfig;
  private reportTimer?: NodeJS.Timeout;
  private sessionId: string;

  private constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      maxErrorsInMemory: 1000,
      maxPatternsTracked: 100,
      reportGenerationInterval: 60 * 60 * 1000, // 1 hour
      errorRetentionDays: 7,
      sensitiveFields: [
        'password', 'token', 'secret', 'key', 'mnemonic', 'privateKey',
        'apiKey', 'sessionToken', 'authToken', 'credentials', 'hash'
      ],
      logLevels: ['warn', 'error', 'critical'],
      enableRemoteLogging: false,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
  }

  public static getInstance(config?: Partial<MonitoringConfig>): ProductionErrorMonitor {
    if (!ProductionErrorMonitor.instance) {
      ProductionErrorMonitor.instance = new ProductionErrorMonitor(config);
    }
    return ProductionErrorMonitor.instance;
  }

  /**
   * Log an error with comprehensive context
   */
  public logError(
    level: ProductionError['level'],
    category: ProductionError['category'],
    code: string,
    message: string,
    context: Record<string, any> = {},
    userMessage?: string,
    error?: Error
  ): string {
    // Skip if log level is not enabled
    if (!this.config.logLevels.includes(level)) {
      return '';
    }

    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    // Sanitize context to remove sensitive data
    const sanitizedContext = this.sanitizeContext(context);
    
    // Collect system information
    const systemInfo = this.collectSystemInfo();
    
    const productionError: ProductionError = {
      id: errorId,
      timestamp,
      level,
      category,
      code,
      message,
      userMessage,
      stack: error?.stack,
      context: {
        ...sanitizedContext,
        ...systemInfo
      },
      sessionId: this.sessionId,
      userId: context.userId ? this.hashUserId(context.userId) : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      resolved: false
    };

    // Store error
    this.storeError(productionError);
    
    // Update error patterns
    this.updateErrorPattern(productionError);
    
    // Log to console with appropriate level
    this.logToConsole(productionError);
    
    // Send to remote logging if enabled
    if (this.config.enableRemoteLogging) {
      this.sendToRemoteLogging(productionError);
    }
    
    // Store in persistent storage
    this.persistError(productionError);

    return errorId;
  }

  /**
   * Mark an error as resolved
   */
  public resolveError(errorId: string, resolutionMethod: string): boolean {
    const error = this.errors.get(errorId);
    if (!error) {
      return false;
    }

    error.resolved = true;
    error.resolutionTime = new Date().toISOString();
    error.resolutionMethod = resolutionMethod;

    // Update pattern resolution statistics
    const pattern = this.patterns.get(error.code);
    if (pattern) {
      // Update resolution rate calculation would go here
    }

    this.persistError(error);
    return true;
  }

  /**
   * Get error patterns for analysis
   */
  public getErrorPatterns(
    category?: string,
    timeRange?: { start: string; end: string }
  ): ErrorPattern[] {
    let patterns = Array.from(this.patterns.values());

    if (category) {
      patterns = patterns.filter(p => p.category === category);
    }

    if (timeRange) {
      const start = new Date(timeRange.start);
      const end = new Date(timeRange.end);
      patterns = patterns.filter(p => {
        const lastSeen = new Date(p.lastSeen);
        return lastSeen >= start && lastSeen <= end;
      });
    }

    // Sort by frequency and recency
    return patterns.sort((a, b) => {
      const aScore = a.frequency * (Date.now() - new Date(a.lastSeen).getTime());
      const bScore = b.frequency * (Date.now() - new Date(b.lastSeen).getTime());
      return bScore - aScore;
    });
  }

  /**
   * Generate diagnostic report
   */
  public generateDiagnosticReport(timeRange?: { start: string; end: string }): DiagnosticReport {
    const reportId = this.generateReportId();
    const timestamp = new Date().toISOString();
    
    const defaultTimeRange = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
      end: timestamp
    };
    
    const range = timeRange || defaultTimeRange;
    
    // Filter errors by time range
    const relevantErrors = Array.from(this.errors.values()).filter(error => {
      const errorTime = new Date(error.timestamp);
      return errorTime >= new Date(range.start) && errorTime <= new Date(range.end);
    });

    // Calculate summary statistics
    const summary = this.calculateSummaryStats(relevantErrors);
    
    // Get top error patterns
    const topErrors = this.getErrorPatterns(undefined, range).slice(0, 10);
    
    // Calculate system health metrics
    const systemHealth = this.calculateSystemHealth(relevantErrors, range);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(topErrors, systemHealth);

    const report: DiagnosticReport = {
      reportId,
      timestamp,
      timeRange: range,
      summary,
      topErrors,
      systemHealth,
      recommendations
    };

    // Store report for future reference
    this.persistReport(report);

    return report;
  }

  /**
   * Get real-time system health status
   */
  public getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    errorRate: number;
    criticalErrors: number;
    lastHourErrors: number;
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = Array.from(this.errors.values()).filter(
      error => new Date(error.timestamp) > oneHourAgo
    );

    const criticalErrors = recentErrors.filter(error => error.level === 'critical').length;
    const errorRate = recentErrors.length / 60; // errors per minute
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (criticalErrors > 0 || errorRate > 5) {
      status = 'critical';
    } else if (errorRate > 1 || recentErrors.filter(e => e.level === 'error').length > 5) {
      status = 'warning';
    }

    return {
      status,
      errorRate,
      criticalErrors,
      lastHourErrors: recentErrors.length
    };
  }

  /**
   * Export error data for external analysis
   */
  public exportErrorData(
    format: 'json' | 'csv',
    timeRange?: { start: string; end: string }
  ): string {
    const errors = timeRange 
      ? Array.from(this.errors.values()).filter(error => {
          const errorTime = new Date(error.timestamp);
          return errorTime >= new Date(timeRange.start) && errorTime <= new Date(timeRange.end);
        })
      : Array.from(this.errors.values());

    if (format === 'json') {
      return JSON.stringify(errors, null, 2);
    } else {
      // CSV format
      const headers = ['timestamp', 'level', 'category', 'code', 'message', 'resolved'];
      const rows = errors.map(error => [
        error.timestamp,
        error.level,
        error.category,
        error.code,
        error.message.replace(/"/g, '""'), // Escape quotes
        error.resolved.toString()
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
  }

  // Private helper methods

  private initializeMonitoring(): void {
    // Load existing errors from storage
    this.loadPersistedErrors();
    
    // Set up periodic report generation
    if (this.config.reportGenerationInterval > 0) {
      this.reportTimer = setInterval(() => {
        this.generateDiagnosticReport();
      }, this.config.reportGenerationInterval);
    }

    // Set up cleanup of old errors
    setInterval(() => {
      this.cleanupOldErrors();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  private storeError(error: ProductionError): void {
    this.errors.set(error.id, error);
    
    // Limit memory usage
    if (this.errors.size > this.config.maxErrorsInMemory) {
      const oldestError = Array.from(this.errors.values())
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];
      this.errors.delete(oldestError.id);
    }
  }

  private updateErrorPattern(error: ProductionError): void {
    const patternKey = `${error.category}_${error.code}`;
    let pattern = this.patterns.get(patternKey);
    
    if (!pattern) {
      pattern = {
        code: error.code,
        category: error.category,
        count: 0,
        firstSeen: error.timestamp,
        lastSeen: error.timestamp,
        frequency: 0,
        affectedUsers: new Set(),
        commonContext: {},
        trend: 'stable'
      };
      this.patterns.set(patternKey, pattern);
    }

    // Update pattern statistics
    pattern.count++;
    pattern.lastSeen = error.timestamp;
    
    if (error.userId) {
      pattern.affectedUsers.add(error.userId);
    }

    // Calculate frequency (errors per hour)
    const timeSpan = new Date(pattern.lastSeen).getTime() - new Date(pattern.firstSeen).getTime();
    const hours = Math.max(timeSpan / (1000 * 60 * 60), 1);
    pattern.frequency = pattern.count / hours;

    // Update trend analysis
    pattern.trend = this.calculateTrend(patternKey);

    // Limit patterns tracked
    if (this.patterns.size > this.config.maxPatternsTracked) {
      const leastFrequent = Array.from(this.patterns.entries())
        .sort(([,a], [,b]) => a.frequency - b.frequency)[0];
      this.patterns.delete(leastFrequent[0]);
    }
  }

  private calculateTrend(patternKey: string): 'increasing' | 'decreasing' | 'stable' {
    // Simple trend calculation based on recent vs older occurrences
    // In a real implementation, this would use more sophisticated analysis
    return 'stable';
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized = { ...context };
    
    // Remove sensitive fields
    this.config.sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeContext(sanitized[key]);
      }
    });

    return sanitized;
  }

  private collectSystemInfo(): Record<string, any> {
    const info: Record<string, any> = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    if (typeof window !== 'undefined') {
      info.windowInfo = {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        online: navigator.onLine
      };
    }

    if (typeof performance !== 'undefined') {
      info.performance = {
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : undefined,
        timing: performance.timing ? {
          loadEventEnd: performance.timing.loadEventEnd,
          navigationStart: performance.timing.navigationStart
        } : undefined
      };
    }

    return info;
  }

  private logToConsole(error: ProductionError): void {
    const logMethod = error.level === 'critical' || error.level === 'error' ? 'error' :
                     error.level === 'warn' ? 'warn' : 'info';
    
    console[logMethod](`[${error.level.toUpperCase()}:${error.category}:${error.code}] ${error.message}`, {
      id: error.id,
      timestamp: error.timestamp,
      context: error.context,
      userMessage: error.userMessage
    });
  }

  private async sendToRemoteLogging(error: ProductionError): Promise<void> {
    if (!this.config.remoteEndpoint) {
      return;
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(error)
      });
    } catch (e) {
      // Silently fail remote logging to avoid recursive errors
      console.warn('Failed to send error to remote logging:', e);
    }
  }

  private persistError(error: ProductionError): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `error_${error.id}`;
        window.localStorage.setItem(key, JSON.stringify(error));
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  private persistReport(report: DiagnosticReport): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `report_${report.reportId}`;
        window.localStorage.setItem(key, JSON.stringify(report));
        
        // Keep list of reports
        const reports = JSON.parse(window.localStorage.getItem('error_reports') || '[]');
        reports.push({
          id: report.reportId,
          timestamp: report.timestamp,
          errorCount: report.summary.totalErrors
        });
        
        // Keep only last 10 reports
        if (reports.length > 10) {
          const oldReport = reports.shift();
          window.localStorage.removeItem(`report_${oldReport.id}`);
        }
        
        window.localStorage.setItem('error_reports', JSON.stringify(reports));
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  private loadPersistedErrors(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('error_')) {
            const errorData = window.localStorage.getItem(key);
            if (errorData) {
              const error: ProductionError = JSON.parse(errorData);
              this.errors.set(error.id, error);
              this.updateErrorPattern(error);
            }
          }
        }
      }
    } catch (e) {
      // Ignore loading errors
    }
  }

  private cleanupOldErrors(): void {
    const cutoffDate = new Date(Date.now() - this.config.errorRetentionDays * 24 * 60 * 60 * 1000);
    
    // Remove old errors from memory
    for (const [id, error] of this.errors.entries()) {
      if (new Date(error.timestamp) < cutoffDate) {
        this.errors.delete(id);
      }
    }

    // Remove old errors from storage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('error_')) {
            const errorData = window.localStorage.getItem(key);
            if (errorData) {
              const error: ProductionError = JSON.parse(errorData);
              if (new Date(error.timestamp) < cutoffDate) {
                window.localStorage.removeItem(key);
              }
            }
          }
        }
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  private calculateSummaryStats(errors: ProductionError[]): DiagnosticReport['summary'] {
    const totalErrors = errors.length;
    const criticalErrors = errors.filter(e => e.level === 'critical').length;
    
    const errorsByCategory: Record<string, number> = {};
    const errorsByLevel: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    errors.forEach(error => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsByLevel[error.level] = (errorsByLevel[error.level] || 0) + 1;
      
      if (error.userId) {
        uniqueUsers.add(error.userId);
      }
    });

    const resolvedErrors = errors.filter(e => e.resolved).length;
    const resolutionRate = totalErrors > 0 ? (resolvedErrors / totalErrors) * 100 : 0;

    return {
      totalErrors,
      criticalErrors,
      errorsByCategory,
      errorsByLevel,
      uniqueUsers: uniqueUsers.size,
      resolutionRate
    };
  }

  private calculateSystemHealth(
    errors: ProductionError[],
    timeRange: { start: string; end: string }
  ): DiagnosticReport['systemHealth'] {
    const timeSpanHours = (new Date(timeRange.end).getTime() - new Date(timeRange.start).getTime()) / (1000 * 60 * 60);
    const errorRate = errors.length / Math.max(timeSpanHours, 1);
    
    const resolvedErrors = errors.filter(e => e.resolved && e.resolutionTime);
    let averageResolutionTime = 0;
    
    if (resolvedErrors.length > 0) {
      const totalResolutionTime = resolvedErrors.reduce((sum, error) => {
        const resolutionTime = new Date(error.resolutionTime!).getTime() - new Date(error.timestamp).getTime();
        return sum + resolutionTime;
      }, 0);
      averageResolutionTime = totalResolutionTime / resolvedErrors.length / (1000 * 60); // minutes
    }

    const uniqueUsers = new Set(errors.map(e => e.userId).filter(Boolean)).size;
    const userImpact = uniqueUsers; // Simple metric, could be more sophisticated

    return {
      errorRate,
      averageResolutionTime,
      userImpact
    };
  }

  private generateRecommendations(
    topErrors: ErrorPattern[],
    systemHealth: DiagnosticReport['systemHealth']
  ): string[] {
    const recommendations: string[] = [];

    // High error rate recommendations
    if (systemHealth.errorRate > 5) {
      recommendations.push('High error rate detected. Consider implementing circuit breakers and rate limiting.');
    }

    // Slow resolution recommendations
    if (systemHealth.averageResolutionTime > 60) {
      recommendations.push('Average error resolution time is high. Review error handling and recovery procedures.');
    }

    // Pattern-based recommendations
    topErrors.forEach(pattern => {
      switch (pattern.category) {
        case 'auth':
          if (pattern.frequency > 10) {
            recommendations.push(`High authentication error frequency for ${pattern.code}. Review authentication flow and user guidance.`);
          }
          break;
        case 'network':
          if (pattern.frequency > 5) {
            recommendations.push(`Frequent network errors detected. Consider implementing retry logic and offline capabilities.`);
          }
          break;
        case 'database':
          if (pattern.frequency > 3) {
            recommendations.push(`Database errors occurring frequently. Review database connection handling and query optimization.`);
          }
          break;
      }
    });

    // User impact recommendations
    if (systemHealth.userImpact > 10) {
      recommendations.push('Multiple users affected by errors. Consider implementing user-specific error tracking and communication.');
    }

    return recommendations;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private hashUserId(userId: string): string {
    // Simple hash for user privacy - in production, use a proper hashing function
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }
  }
}

// Export singleton instance
export const productionErrorMonitor = ProductionErrorMonitor.getInstance({
  logLevels: ['warn', 'error', 'critical'],
  enableRemoteLogging: false, // Enable in production with proper endpoint
  maxErrorsInMemory: 500,
  errorRetentionDays: 7
});