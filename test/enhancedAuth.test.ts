/**
 * Enhanced Authentication System Tests
 * Tests comprehensive error handling, user feedback, and automatic recovery
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { authErrorHandler } from '../services/authErrorHandler';

describe('Enhanced Authentication System', () => {
  beforeEach(() => {
    // Clear any existing state
  });

  describe('Error Handler', () => {
    it('should create diagnostic session', () => {
      const sessionId = authErrorHandler.startDiagnosticSession('login', 'testuser');
      
      expect(sessionId).toMatch(/^auth_\d+_[a-z0-9]+$/);
      
      const diagnostics = authErrorHandler.getDiagnostics(sessionId);
      expect(diagnostics).toBeTruthy();
      expect(diagnostics?.operation).toBe('login');
      expect(diagnostics?.userId).toBe('testuser');
    });

    it('should handle network errors with user-friendly messages', async () => {
      const error = new Error('Network request failed');
      const authError = await authErrorHandler.handleAuthError(error, { operation: 'login' });

      expect(authError.type).toBe('NETWORK');
      expect(authError.userMessage).toContain('Connection issue detected');
      expect(authError.recoverable).toBe(true);
      expect(authError.recoveryActions).toContain('retry_connection');
    });

    it('should handle database errors with appropriate messaging', async () => {
      const error = new Error('IndexedDB operation failed');
      const authError = await authErrorHandler.handleAuthError(error, { operation: 'login' });

      expect(authError.type).toBe('SYSTEM');
      expect(authError.userMessage).toContain('Storage system temporarily unavailable');
      expect(authError.recoverable).toBe(true);
    });

    it('should handle authentication failures', async () => {
      const error = new Error('Invalid password');
      const authError = await authErrorHandler.handleAuthError(error, { operation: 'login' });

      expect(authError.type).toBe('VALIDATION');
      expect(authError.userMessage).toContain('Login credentials are incorrect');
      expect(authError.recoverable).toBe(false);
    });

    it('should sanitize sensitive information in logs', async () => {
      const error = new Error('Test error');
      const context = {
        password: 'secret123',
        token: 'abc123',
        username: 'testuser'
      };

      const authError = await authErrorHandler.handleAuthError(error, context);
      
      // Check that sensitive data is not in the stored context
      expect(authError.context?.password).toBe('[REDACTED]');
      expect(authError.context?.token).toBe('[REDACTED]');
      expect(authError.context?.username).toBe('testuser'); // Non-sensitive data preserved
    });

    it('should end diagnostic session with performance metrics', async () => {
      const sessionId = authErrorHandler.startDiagnosticSession('login', 'testuser');
      
      // Wait a small amount to ensure duration is measurable
      await new Promise(resolve => setTimeout(resolve, 10));
      
      authErrorHandler.endDiagnosticSession(sessionId, true);
      
      const diagnostics = authErrorHandler.getDiagnostics(sessionId);
      expect(diagnostics?.success).toBe(true);
      expect(diagnostics?.endTime).toBeTruthy();
      expect(diagnostics?.performanceMetrics?.duration).toBeGreaterThan(0);
    });

    it('should add warnings to diagnostic session', () => {
      const sessionId = authErrorHandler.startDiagnosticSession('login', 'testuser');
      
      authErrorHandler.addWarning(sessionId, 'Test warning message');
      
      const diagnostics = authErrorHandler.getDiagnostics(sessionId);
      expect(diagnostics?.warnings).toHaveLength(1);
      expect(diagnostics?.warnings[0]).toContain('Test warning message');
    });

    it('should clear old diagnostic sessions', () => {
      const sessionId = authErrorHandler.startDiagnosticSession('login', 'testuser');
      
      // Manually set an old timestamp to simulate old session
      const diagnostics = authErrorHandler.getDiagnostics(sessionId);
      if (diagnostics) {
        diagnostics.startTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago
      }
      
      // Clear diagnostics older than 24 hours
      authErrorHandler.clearOldDiagnostics(24 * 60 * 60 * 1000);
      
      // Session should now be cleared
      expect(authErrorHandler.getDiagnostics(sessionId)).toBeNull();
    });

    it('should track error patterns', async () => {
      // Clear existing patterns first
      const initialPatterns = authErrorHandler.getErrorPatterns();
      const initialNetworkCount = initialPatterns['NETWORK_ERROR'] || 0;
      const initialAuthCount = initialPatterns['AUTH_FAILED'] || 0;

      await authErrorHandler.handleAuthError(new Error('Network request failed'), {});
      await authErrorHandler.handleAuthError(new Error('Network timeout'), {});
      await authErrorHandler.handleAuthError(new Error('Invalid password'), {});

      const patterns = authErrorHandler.getErrorPatterns();
      expect(patterns['NETWORK_ERROR']).toBe(initialNetworkCount + 2);
      expect(patterns['AUTH_FAILED']).toBe(initialAuthCount + 1);
    });

    it('should handle crypto errors with fallback messaging', async () => {
      const error = new Error('Web Crypto API not available');
      const authError = await authErrorHandler.handleAuthError(error, { operation: 'login' });

      expect(authError.type).toBe('SECURITY');
      expect(authError.userMessage).toContain('Security system initialization failed');
      expect(authError.recoverable).toBe(true);
      expect(authError.recoveryActions).toContain('use_fallback_crypto');
    });

    it('should handle lockout errors appropriately', async () => {
      const error = new Error('Account locked due to too many failed attempts');
      const authError = await authErrorHandler.handleAuthError(error, { operation: 'login' });

      expect(authError.type).toBe('SECURITY');
      expect(authError.code).toBe('ACCOUNT_LOCKED');
      expect(authError.userMessage).toContain('temporarily locked for security');
      expect(authError.recoverable).toBe(true);
    });

    it('should handle recovery errors', async () => {
      const error = new Error('Invalid mnemonic phrase provided');
      const authError = await authErrorHandler.handleAuthError(error, { operation: 'recover' });

      expect(authError.type).toBe('RECOVERY');
      expect(authError.userMessage).toContain('Recovery information is incomplete');
      expect(authError.recoverable).toBe(false);
    });

    it('should handle configuration errors with recovery', async () => {
      const error = new Error('Configuration file not found');
      const authError = await authErrorHandler.handleAuthError(error, { operation: 'login' });

      expect(authError.type).toBe('SYSTEM');
      expect(authError.code).toBe('CONFIG_ERROR');
      expect(authError.userMessage).toContain('System configuration issue detected');
      expect(authError.recoverable).toBe(true);
    });
  });
});