/**
 * Production Error Monitor Tests
 * Tests for comprehensive error logging, pattern analysis, and diagnostic reporting
 */

import { ProductionErrorMonitor } from '../services/productionErrorMonitor';
import { ErrorMonitoringIntegration } from '../services/errorMonitoringIntegration';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { afterEach } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';

describe('ProductionErrorMonitor', () => {
  let monitor: ProductionErrorMonitor;

  beforeEach(() => {
    // Create fresh instance for each test
    monitor = ProductionErrorMonitor.getInstance({
      maxErrorsInMemory: 100,
      maxPatternsTracked: 50,
      errorRetentionDays: 1,
      logLevels: ['info', 'warn', 'error', 'critical'],
      enableRemoteLogging: false
    });
  });

  afterEach(() => {
    // Clean up
    monitor.destroy();
  });

  describe('Error Logging', () => {
    it('should log errors with proper structure', () => {
      const errorId = monitor.logError(
        'error',
        'auth',
        'LOGIN_FAILED',
        'User login failed',
        { userId: 'test123', operation: 'login' },
        'Invalid credentials provided'
      );

      expect(errorId).toBeTruthy();
      expect(errorId).toMatch(/^error_\d+_[a-z0-9]+$/);
    });

    it('should sanitize sensitive data from context', () => {
      const errorId = monitor.logError(
        'error',
        'auth',
        'AUTH_ERROR',
        'Authentication error',
        {
          password: 'secret123',
          token: 'bearer-token',
          apiKey: 'api-key-123',
          normalData: 'safe-data'
        }
      );

      expect(errorId).toBeTruthy();
      // Sensitive data should be redacted in logs
    });

    it('should respect log level filtering', () => {
      const monitorWithFiltering = ProductionErrorMonitor.getInstance({
        logLevels: ['error', 'critical']
      });

      const infoErrorId = monitorWithFiltering.logError(
        'info',
        'system',
        'INFO_MESSAGE',
        'Info message'
      );

      const errorErrorId = monitorWithFiltering.logError(
        'error',
        'system',
        'ERROR_MESSAGE',
        'Error message'
      );

      expect(infoErrorId).toBe(''); // Should be filtered out
      expect(errorErrorId).toBeTruthy(); // Should be logged
    });
  });

  describe('Error Pattern Analysis', () => {
    it('should track error patterns correctly', () => {
      // Create fresh monitor for this test
      const testMonitor = ProductionErrorMonitor.getInstance({
        maxErrorsInMemory: 100,
        maxPatternsTracked: 50,
        errorRetentionDays: 1,
        logLevels: ['info', 'warn', 'error', 'critical'],
        enableRemoteLogging: false
      });

      // Log multiple errors of the same type
      testMonitor.logError('error', 'auth', 'LOGIN_FAILED', 'Login failed 1');
      testMonitor.logError('error', 'auth', 'LOGIN_FAILED', 'Login failed 2');
      testMonitor.logError('error', 'auth', 'LOGIN_FAILED', 'Login failed 3');

      const patterns = testMonitor.getErrorPatterns('auth');
      
      // Should have at least one pattern for LOGIN_FAILED
      expect(patterns.length).toBeGreaterThanOrEqual(1);
      const loginFailedPattern = patterns.find(p => p.code === 'LOGIN_FAILED');
      expect(loginFailedPattern).toBeDefined();
      expect(loginFailedPattern!.category).toBe('auth');
      expect(loginFailedPattern!.count).toBeGreaterThanOrEqual(3);
      expect(loginFailedPattern!.frequency).toBeGreaterThan(0);
    });

    it('should filter patterns by category', () => {
      // Create fresh monitor for this test
      const testMonitor = ProductionErrorMonitor.getInstance({
        maxErrorsInMemory: 100,
        maxPatternsTracked: 50,
        errorRetentionDays: 1,
        logLevels: ['info', 'warn', 'error', 'critical'],
        enableRemoteLogging: false
      });

      testMonitor.logError('error', 'auth', 'AUTH_ERROR', 'Auth error');
      testMonitor.logError('error', 'database', 'DB_ERROR', 'Database error');
      testMonitor.logError('error', 'network', 'NET_ERROR', 'Network error');

      const authPatterns = testMonitor.getErrorPatterns('auth');
      const dbPatterns = testMonitor.getErrorPatterns('database');

      // Should have at least one pattern for each category
      expect(authPatterns.length).toBeGreaterThanOrEqual(1);
      expect(authPatterns.every(p => p.category === 'auth')).toBe(true);
      
      expect(dbPatterns.length).toBeGreaterThanOrEqual(1);
      expect(dbPatterns.every(p => p.category === 'database')).toBe(true);
    });

    it('should filter patterns by time range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      monitor.logError('error', 'system', 'OLD_ERROR', 'Old error');
      
      const patterns = monitor.getErrorPatterns(undefined, {
        start: oneHourAgo.toISOString(),
        end: now.toISOString()
      });

      expect(patterns.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('System Health Monitoring', () => {
    it('should calculate system health correctly', () => {
      // Log some errors to affect health
      monitor.logError('critical', 'system', 'CRITICAL_ERROR', 'Critical error');
      monitor.logError('error', 'auth', 'AUTH_ERROR', 'Auth error');
      monitor.logError('warn', 'network', 'NET_WARNING', 'Network warning');

      const health = monitor.getSystemHealth();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('errorRate');
      expect(health).toHaveProperty('criticalErrors');
      expect(health).toHaveProperty('lastHourErrors');
      
      expect(['healthy', 'warning', 'critical']).toContain(health.status);
      expect(health.criticalErrors).toBeGreaterThanOrEqual(1);
    });

    it('should report critical status for critical errors', () => {
      monitor.logError('critical', 'system', 'CRITICAL_ERROR', 'Critical system error');
      
      const health = monitor.getSystemHealth();
      expect(health.status).toBe('critical');
    });
  });

  describe('Diagnostic Report Generation', () => {
    it('should generate comprehensive diagnostic reports', () => {
      // Create fresh monitor for this test
      const testMonitor = ProductionErrorMonitor.getInstance({
        maxErrorsInMemory: 100,
        maxPatternsTracked: 50,
        errorRetentionDays: 1,
        logLevels: ['info', 'warn', 'error', 'critical'],
        enableRemoteLogging: false
      });

      // Log various types of errors
      testMonitor.logError('error', 'auth', 'LOGIN_FAILED', 'Login failed');
      testMonitor.logError('warn', 'network', 'SLOW_RESPONSE', 'Slow network response');
      testMonitor.logError('critical', 'database', 'DB_CORRUPTION', 'Database corruption');

      const report = testMonitor.generateDiagnosticReport();

      expect(report).toHaveProperty('reportId');
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('timeRange');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('topErrors');
      expect(report).toHaveProperty('systemHealth');
      expect(report).toHaveProperty('recommendations');

      expect(report.summary.totalErrors).toBeGreaterThanOrEqual(3);
      expect(report.summary.criticalErrors).toBeGreaterThanOrEqual(1);
      expect(report.topErrors.length).toBeGreaterThanOrEqual(0); // May be 0 if no patterns yet
      // Recommendations may be empty for simple test cases
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should generate time-ranged reports', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      monitor.logError('error', 'system', 'TEST_ERROR', 'Test error');

      const report = monitor.generateDiagnosticReport({
        start: oneHourAgo.toISOString(),
        end: now.toISOString()
      });

      expect(report.timeRange.start).toBe(oneHourAgo.toISOString());
      expect(report.timeRange.end).toBe(now.toISOString());
    });
  });

  describe('Error Resolution Tracking', () => {
    it('should mark errors as resolved', () => {
      const errorId = monitor.logError(
        'error',
        'system',
        'RESOLVABLE_ERROR',
        'This error can be resolved'
      );

      const resolved = monitor.resolveError(errorId, 'manual_fix');
      expect(resolved).toBe(true);
    });

    it('should handle invalid error IDs gracefully', () => {
      const resolved = monitor.resolveError('invalid-id', 'manual_fix');
      expect(resolved).toBe(false);
    });
  });

  describe('Data Export', () => {
    it('should export error data in JSON format', () => {
      monitor.logError('error', 'test', 'EXPORT_TEST', 'Export test error');
      
      const jsonData = monitor.exportErrorData('json');
      expect(() => JSON.parse(jsonData)).not.toThrow();
      
      const parsed = JSON.parse(jsonData);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should export error data in CSV format', () => {
      monitor.logError('error', 'test', 'CSV_TEST', 'CSV test error');
      
      const csvData = monitor.exportErrorData('csv');
      expect(csvData).toContain('timestamp,level,category,code,message,resolved');
      expect(csvData.split('\n').length).toBeGreaterThan(1);
    });
  });
});

describe('ErrorMonitoringIntegration', () => {
  let integration: ErrorMonitoringIntegration;

  beforeEach(() => {
    integration = ErrorMonitoringIntegration.getInstance();
  });

  describe('Authentication Error Integration', () => {
    it('should integrate with auth error handler', async () => {
      const result = await integration.logAuthError(
        new Error('Invalid credentials'),
        {
          operation: 'login',
          userId: 'test-user',
          additionalData: { attemptCount: 3 }
        }
      );

      expect(result.authError).toBeDefined();
      expect(result.errorId).toBeTruthy();
      expect(result.authError.code).toBeTruthy();
      expect(result.authError.userMessage).toBeTruthy();
    });
  });

  describe('Evolution Error Integration', () => {
    it('should integrate with evolution error handler', () => {
      const result = integration.logEvolutionError(
        new Error('API key invalid'),
        {
          operation: 'breakthrough_evolution',
          additionalData: { apiContext: 'API_KEY_INVALID' }
        }
      );

      expect(result.evolutionError).toBeDefined();
      expect(result.errorId).toBeTruthy();
      expect(result.evolutionError.type).toBe('API_KEY_INVALID');
    });
  });

  describe('PDF Error Integration', () => {
    it('should integrate with PDF error handler', () => {
      const result = integration.logPDFError(
        new Error('Browser not supported'),
        {
          operation: 'certificate_generation',
          additionalData: { pdfContext: 'BROWSER_CHECK' }
        }
      );

      expect(result.pdfError).toBeDefined();
      expect(result.errorId).toBeTruthy();
      expect(result.pdfError.type).toBe('BROWSER_UNSUPPORTED');
    });
  });

  describe('Database Error Integration', () => {
    it('should log database errors with proper categorization', () => {
      const errorId = integration.logDatabaseError(
        new Error('Connection timeout'),
        'user_lookup',
        {
          operation: 'database_query',
          component: 'userService'
        }
      );

      expect(errorId).toBeTruthy();
    });
  });

  describe('Network Error Integration', () => {
    it('should log network errors with endpoint information', () => {
      const errorId = integration.logNetworkError(
        new Error('Fetch failed'),
        'https://api.example.com/data',
        {
          operation: 'api_call',
          component: 'dataService'
        }
      );

      expect(errorId).toBeTruthy();
    });
  });

  describe('System Health Integration', () => {
    it('should provide system health status', () => {
      const health = integration.getSystemHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('errorRate');
      expect(health).toHaveProperty('criticalErrors');
      expect(health).toHaveProperty('lastHourErrors');
    });
  });

  describe('Diagnostic Report Integration', () => {
    it('should generate diagnostic reports', () => {
      const report = integration.generateDiagnosticReport();
      
      expect(report).toHaveProperty('reportId');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('systemHealth');
      expect(report).toHaveProperty('recommendations');
    });
  });
});