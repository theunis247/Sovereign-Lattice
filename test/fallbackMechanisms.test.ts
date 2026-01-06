/**
 * Fallback Mechanisms Tests
 * Tests graceful degradation and fallback systems across all components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StylingService } from '../services/stylingService';
import { SafeDeepSeekClient } from '../services/safeDeepSeekClient';
import { CryptoFallbackService } from '../services/cryptoFallback';
import { safeRegistry } from '../services/safeRegistryService';
import { authErrorHandler } from '../services/authErrorHandler';

describe('Fallback Mechanisms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Progressive Enhancement Strategy', () => {
    it('should start with minimal functionality and enhance progressively', async () => {
      // Start with no enhancements
      const stylingService = new (StylingService as any)();
      const initialState = stylingService.getState();
      
      expect(initialState.isTailwindLoaded).toBe(false);
      expect(initialState.hasStylesLoaded).toBe(false);
      expect(initialState.fallbackMode).toBe(false);

      // Force fallback mode
      stylingService.forceFallbackMode('Progressive enhancement test');
      
      const fallbackState = stylingService.getState();
      expect(fallbackState.fallbackMode).toBe(true);

      // Should still provide basic functionality
      const classes = stylingService.getClasses('advanced-classes', 'basic-fallback');
      expect(classes).toBe('basic-fallback');
    });

    it('should enhance functionality as services become available', async () => {
      const safeClient = new SafeDeepSeekClient();
      const notifications: any[] = [];
      
      safeClient.setNotificationCallback((notification) => {
        notifications.push(notification);
      });

      // Start with unavailable service
      const { deepSeekClient } = await import('../services/deepSeekClient');
      vi.mocked(deepSeekClient.isConfigured).mockResolvedValue(false);

      let status = await safeClient.initialize();
      expect(status.fallbackMode).toBe(true);
      expect(status.features.miningEvaluation).toBe(false);

      // Simulate service becoming available
      vi.mocked(deepSeekClient.isConfigured).mockResolvedValue(true);
      vi.mocked(deepSeekClient.testConnection).mockResolvedValue(true);

      status = await safeClient.initialize();
      expect(status.fallbackMode).toBe(false);
      expect(status.features.miningEvaluation).toBe(true);
    });

    it('should maintain core functionality during service transitions', async () => {
      const sessionId = authErrorHandler.startDiagnosticSession('login', 'testuser');
      
      // Test registry functionality during various states
      const user1 = safeRegistry.initializeUserDataStructures({
        address: 'test1',
        username: 'user1'
      });

      // Simulate system stress
      for (let i = 0; i < 10; i++) {
        const user = safeRegistry.initializeUserDataStructures({
          address: `test${i}`,
          username: `user${i}`
        });
        expect(user.address).toBe(`test${i}`);
      }

      authErrorHandler.endDiagnosticSession(sessionId, true);
      const diagnostics = authErrorHandler.getDiagnostics(sessionId);
      
      expect(user1.address).toBe('test1');
      expect(diagnostics?.success).toBe(true);
    });
  });

  describe('Cascading Fallback Systems', () => {
    it('should cascade through multiple fallback levels for crypto operations', async () => {
      // Test full crypto support
      let result = CryptoFallbackService.generateRandomBytes(16);
      expect(result.success).toBe(true);
      const originalMethod = result.method;

      // Mock partial crypto failure
      const originalCrypto = global.crypto;
      global.crypto = {
        getRandomValues: vi.fn().mockImplementation(() => {
          throw new Error('getRandomValues failed');
        })
      } as any;

      result = CryptoFallbackService.generateRandomBytes(16);
      expect(result.success).toBe(true);
      expect(result.method).toBe('fallback');

      // Mock complete crypto failure
      delete (global as any).crypto;

      result = CryptoFallbackService.generateRandomBytes(16);
      expect(result.success).toBe(true);
      expect(result.method).toBe('fallback');

      // Restore crypto
      global.crypto = originalCrypto;
    });

    it('should cascade through hashing fallbacks', async () => {
      const testData = 'test data for hashing';

      // Test with full crypto support
      let result = await CryptoFallbackService.hashData(testData);
      expect(result.success).toBe(true);

      // Mock subtle crypto failure
      const originalCrypto = global.crypto;
      global.crypto = {
        ...global.crypto,
        subtle: {
          digest: vi.fn().mockRejectedValue(new Error('Digest failed'))
        }
      } as any;

      result = await CryptoFallbackService.hashData(testData);
      expect(result.success).toBe(true);
      expect(result.method).toBe('fallback');

      // Mock complete crypto failure
      delete (global as any).crypto;

      result = await CryptoFallbackService.hashData(testData);
      expect(result.success).toBe(true);
      expect(result.method).toBe('fallback');

      // Restore crypto
      global.crypto = originalCrypto;
    });

    it('should cascade through key derivation fallbacks', async () => {
      const password = 'test password';
      const salt = 'test salt';

      // Test with full crypto support
      let result = await CryptoFallbackService.deriveKey(password, salt, 1000);
      expect(result.success).toBe(true);

      // Mock PBKDF2 failure
      const originalCrypto = global.crypto;
      global.crypto = {
        ...global.crypto,
        subtle: {
          importKey: vi.fn().mockRejectedValue(new Error('Import failed')),
          deriveBits: vi.fn().mockRejectedValue(new Error('Derive failed'))
        }
      } as any;

      result = await CryptoFallbackService.deriveKey(password, salt, 1000);
      expect(result.success).toBe(true);
      expect(result.method).toBe('fallback');

      // Restore crypto
      global.crypto = originalCrypto;
    });
  });

  describe('Service Isolation and Independence', () => {
    it('should isolate styling failures from other services', async () => {
      // Force styling failure
      const stylingService = new (StylingService as any)();
      stylingService.forceFallbackMode('Isolation test');

      // Other services should work normally
      const cryptoResult = CryptoFallbackService.generateRandomBytes(16);
      expect(cryptoResult.success).toBe(true);

      const userResult = safeRegistry.initializeUserDataStructures({
        address: 'test-address',
        username: 'testuser'
      });
      expect(userResult.address).toBe('test-address');

      const stylingState = stylingService.getState();
      expect(stylingState.fallbackMode).toBe(true);
    });

    it('should isolate DeepSeek failures from authentication', async () => {
      const safeClient = new SafeDeepSeekClient();
      
      // Mock DeepSeek failure
      const { deepSeekClient } = await import('../services/deepSeekClient');
      vi.mocked(deepSeekClient.isConfigured).mockRejectedValue(new Error('DeepSeek unavailable'));

      const status = await safeClient.initialize();
      expect(status.fallbackMode).toBe(true);

      // Authentication should still work
      const sessionId = authErrorHandler.startDiagnosticSession('login', 'testuser');
      expect(sessionId).toBeDefined();

      const userResult = safeRegistry.initializeUserDataStructures({
        address: 'test-address',
        username: 'testuser'
      });
      expect(userResult.address).toBe('test-address');

      authErrorHandler.endDiagnosticSession(sessionId, true);
      const diagnostics = authErrorHandler.getDiagnostics(sessionId);
      expect(diagnostics?.success).toBe(true);
    });

    it('should isolate crypto failures from user management', () => {
      // Mock crypto failure
      const originalCrypto = global.crypto;
      delete (global as any).crypto;

      const cryptoSupport = CryptoFallbackService.getSupportInfo();
      expect(cryptoSupport.supportLevel).toBe('fallback');

      // User management should still work
      const userResult = safeRegistry.initializeUserDataStructures({
        address: 'test-address',
        username: 'testuser'
      });
      expect(userResult.address).toBe('test-address');

      const validationResult = safeRegistry.validateAndFixUserStructure(userResult);
      expect(validationResult.isValid).toBe(true);

      // Restore crypto
      global.crypto = originalCrypto;
    });
  });

  describe('Fallback Quality and Consistency', () => {
    it('should maintain consistent behavior across fallback modes', async () => {
      // Test crypto operations in different modes
      const testData = 'consistent test data';
      
      // Full mode
      const fullResult = await CryptoFallbackService.hashData(testData);
      expect(fullResult.success).toBe(true);

      // Fallback mode
      const originalCrypto = global.crypto;
      delete (global as any).crypto;

      const fallbackResult = await CryptoFallbackService.hashData(testData);
      expect(fallbackResult.success).toBe(true);

      // Results should be consistent (same input, same output in same mode)
      const fallbackResult2 = await CryptoFallbackService.hashData(testData);
      expect(fallbackResult.data).toBe(fallbackResult2.data);

      // Restore crypto
      global.crypto = originalCrypto;
    });

    it('should provide equivalent functionality in fallback modes', () => {
      const stylingService = new (StylingService as any)();
      
      // Test normal mode
      const normalClasses = stylingService.getClasses('bg-blue-500 text-white', 'fallback-button');
      expect(normalClasses).toBe('bg-blue-500 text-white');

      // Test fallback mode
      stylingService.forceFallbackMode('Consistency test');
      const fallbackClasses = stylingService.getClasses('bg-blue-500 text-white', 'fallback-button');
      expect(fallbackClasses).toBe('fallback-button');

      // Both should provide usable classes
      expect(normalClasses.length).toBeGreaterThan(0);
      expect(fallbackClasses.length).toBeGreaterThan(0);
    });

    it('should maintain security standards in fallback modes', async () => {
      // Mock crypto unavailable
      const originalCrypto = global.crypto;
      delete (global as any).crypto;

      // Test that fallback crypto still provides reasonable security
      const password1 = CryptoFallbackService.generateSecurePassword(16);
      const password2 = CryptoFallbackService.generateSecurePassword(16);

      expect(password1.success).toBe(true);
      expect(password2.success).toBe(true);
      expect(password1.data).not.toBe(password2.data); // Should be different

      // Test encryption/decryption
      const testData = 'sensitive data';
      const key = 'encryption key';

      const encryptResult = CryptoFallbackService.simpleEncrypt(testData, key);
      expect(encryptResult.success).toBe(true);
      expect(encryptResult.data).not.toBe(testData); // Should be encrypted

      const decryptResult = CryptoFallbackService.simpleDecrypt(encryptResult.data!, key);
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(testData); // Should decrypt correctly

      // Restore crypto
      global.crypto = originalCrypto;
    });
  });

  describe('Recovery and Retry Mechanisms', () => {
    it('should attempt recovery when services become available', async () => {
      const safeClient = new SafeDeepSeekClient();
      const notifications: any[] = [];
      
      safeClient.setNotificationCallback((notification) => {
        notifications.push(notification);
      });

      // Start with service unavailable
      const { deepSeekClient } = await import('../services/deepSeekClient');
      vi.mocked(deepSeekClient.isConfigured).mockResolvedValue(false);

      let status = await safeClient.initialize();
      expect(status.fallbackMode).toBe(true);

      // Simulate service recovery
      vi.mocked(deepSeekClient.isConfigured).mockResolvedValue(true);
      vi.mocked(deepSeekClient.testConnection).mockResolvedValue(true);

      // Re-initialize should detect recovery
      status = await safeClient.initialize();
      expect(status.fallbackMode).toBe(false);
      expect(status.isAvailable).toBe(true);
    });

    it('should handle intermittent failures gracefully', async () => {
      const safeClient = new SafeDeepSeekClient();
      
      // Mock intermittent failures
      const { deepSeekClient } = await import('../services/deepSeekClient');
      vi.mocked(deepSeekClient.isConfigured).mockResolvedValue(true);
      vi.mocked(deepSeekClient.testConnection).mockResolvedValue(true);
      
      let callCount = 0;
      vi.mocked(deepSeekClient.evaluateMiningBreakthrough).mockImplementation(async () => {
        callCount++;
        if (callCount % 2 === 0) {
          throw new Error('Intermittent failure');
        }
        return {
          grade: 'A',
          breakthroughScore: 95,
          explanation: 'Test result'
        };
      });

      await safeClient.initialize();

      // First call should succeed
      const result1 = await safeClient.evaluateMiningBreakthrough({ problem: 'test' });
      expect(result1.isFallback).toBe(false);

      // Second call should fail and use fallback
      const result2 = await safeClient.evaluateMiningBreakthrough({ problem: 'test' });
      expect(result2.isFallback).toBe(true);

      // Third call should succeed again
      const result3 = await safeClient.evaluateMiningBreakthrough({ problem: 'test' });
      expect(result3.isFallback).toBe(false);
    });

    it('should provide diagnostic information for recovery', async () => {
      const sessionId = authErrorHandler.startDiagnosticSession('recovery_test', 'testuser');
      
      // Simulate various error conditions
      await authErrorHandler.handleAuthError(new Error('Network timeout'), { operation: 'login' });
      await authErrorHandler.handleAuthError(new Error('Service unavailable'), { operation: 'login' });
      
      authErrorHandler.addWarning(sessionId, 'Fallback mode activated');
      authErrorHandler.addWarning(sessionId, 'Retrying with alternative method');
      
      authErrorHandler.endDiagnosticSession(sessionId, true);
      
      const diagnostics = authErrorHandler.getDiagnostics(sessionId);
      expect(diagnostics?.warnings.length).toBeGreaterThan(0);
      expect(diagnostics?.success).toBe(true);
      expect(diagnostics?.performanceMetrics?.duration).toBeGreaterThan(0);
    });
  });

  describe('User Experience During Fallbacks', () => {
    it('should provide appropriate user feedback during fallback activation', async () => {
      const notifications: any[] = [];
      const safeClient = new SafeDeepSeekClient();
      
      safeClient.setNotificationCallback((notification) => {
        notifications.push(notification);
      });

      // Mock service failure
      const { deepSeekClient } = await import('../services/deepSeekClient');
      vi.mocked(deepSeekClient.isConfigured).mockResolvedValue(true);
      vi.mocked(deepSeekClient.testConnection).mockResolvedValue(false);

      await safeClient.initialize();

      // Should notify user about fallback
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications.some(n => n.type === 'error')).toBe(true);
    });

    it('should maintain responsive UI during fallback operations', async () => {
      const startTime = performance.now();
      
      // Force all systems into fallback mode
      const stylingService = new (StylingService as any)();
      stylingService.forceFallbackMode('Performance test');

      // Perform multiple operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(CryptoFallbackService.generateRandomBytes(32));
        operations.push(CryptoFallbackService.hashData(`test data ${i}`));
      }

      await Promise.all(operations.filter(op => op instanceof Promise));

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly even in fallback mode
      expect(duration).toBeLessThan(1000);
    });

    it('should preserve user data integrity during fallbacks', () => {
      // Test with various corrupted user data scenarios
      const corruptedUsers = [
        { address: 'test1', username: 'user1', contacts: null },
        { address: 'test2', username: 'user2', transactions: 'invalid' },
        { address: 'test3', username: 'user3', balance: 'not-a-number' }
      ];

      corruptedUsers.forEach((user, index) => {
        const result = safeRegistry.validateAndFixUserStructure(user as any);
        expect(result.isValid).toBe(true);
        expect(user.address).toBe(`test${index + 1}`);
        expect(Array.isArray((user as any).contacts)).toBe(true);
        expect(Array.isArray((user as any).transactions)).toBe(true);
        expect(typeof (user as any).balance).toBe('number');
      });
    });
  });
});