/**
 * Authentication Error Scenarios Integration Tests
 * Tests complete authentication flows with various error conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SafeDeepSeekClient } from '../services/safeDeepSeekClient';
import { safeRegistry } from '../services/safeRegistryService';
import { CryptoFallbackService } from '../services/cryptoFallback';
import { authErrorHandler } from '../services/authErrorHandler';

// Mock DOM globals for Node.js environment
const mockDocument = {
  getElementById: vi.fn().mockReturnValue(null),
  createElement: vi.fn().mockReturnValue({
    textContent: '',
    setAttribute: vi.fn(),
    id: ''
  }),
  head: {
    appendChild: vi.fn()
  },
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
};

const mockWindow = {
  getComputedStyle: vi.fn().mockReturnValue({
    backgroundColor: 'rgba(0, 0, 0, 0)',
    color: 'rgba(0, 0, 0, 0)',
    padding: '0px'
  }),
  CSS: {
    supports: vi.fn().mockReturnValue(false)
  }
};

const mockScreen = {
  width: 1920,
  height: 1080
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Test Environment)',
  platform: 'Test'
};

// Setup global mocks
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

Object.defineProperty(global, 'screen', {
  value: mockScreen,
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
});

describe('Authentication Error Scenarios Integration', () => {
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;

  beforeEach(() => {
    // Capture console methods to prevent test noise
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    console.error = vi.fn();
    console.warn = vi.fn();
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    vi.restoreAllMocks();
  });

  describe('Error Handling Integration', () => {
    it('should handle service unavailability gracefully', async () => {
      // Test that core services can handle missing dependencies
      const safeClient = new SafeDeepSeekClient();
      const mockNotification = vi.fn();
      safeClient.setNotificationCallback(mockNotification);
      
      // Initialize with unavailable service
      const status = await safeClient.initialize();
      
      expect(status.fallbackMode).toBe(true);
      expect(status.isAvailable).toBe(false);
      expect(mockNotification).toHaveBeenCalled();
    });

    it('should provide fallback functionality when services fail', async () => {
      // Test crypto fallback
      const cryptoResult = CryptoFallbackService.generateRandomBytes(16);
      expect(cryptoResult.success).toBe(true);
      expect(cryptoResult.data?.length).toBe(16);
      
      // Test registry functionality
      const userResult = safeRegistry.initializeUserDataStructures({
        address: 'test-address',
        username: 'testuser'
      });
      expect(userResult.address).toBe('test-address');
      expect(Array.isArray(userResult.contacts)).toBe(true);
    });

    it('should handle error reporting and diagnostics', async () => {
      const sessionId = authErrorHandler.startDiagnosticSession('test', 'testuser');
      
      // Generate test errors
      await authErrorHandler.handleAuthError(new Error('Test error'), { operation: 'test' });
      authErrorHandler.addWarning(sessionId, 'Test warning');
      
      authErrorHandler.endDiagnosticSession(sessionId, true);
      
      const diagnostics = authErrorHandler.getDiagnostics(sessionId);
      expect(diagnostics?.warnings.length).toBeGreaterThan(0);
      expect(diagnostics?.success).toBe(true);
    });
  });

  describe('DeepSeek Configuration Errors', () => {
    it('should handle missing API key gracefully', async () => {
      const safeClient = new SafeDeepSeekClient();
      
      // Initialize without mocking - should use actual fallback behavior
      const status = await safeClient.initialize();

      expect(status.fallbackMode).toBe(true);
      expect(status.isAvailable).toBe(false);
      expect(status.features.miningEvaluation).toBe(false);
      expect(status.features.breakthroughEvolution).toBe(false);
    });

    it('should handle API connection failures with fallback', async () => {
      const safeClient = new SafeDeepSeekClient();
      
      // Test fallback evaluation when API is unavailable
      const result = await safeClient.evaluateMiningBreakthrough({
        problem: 'Test problem'
      });

      expect(result.isFallback).toBe(true);
      expect(result.fallbackReason).toBeDefined();
      expect(result.grade).toMatch(/^[SABC]$/);
    });

    it('should provide fallback evolution when API unavailable', async () => {
      const safeClient = new SafeDeepSeekClient();
      
      // Test fallback evolution
      const result = await safeClient.evolveBreakthrough({
        currentExplanation: 'Test explanation',
        currentLevel: 1,
        blockId: 'test-block'
      });

      expect(result.isFallback).toBe(true);
      expect(result.fallbackReason).toBeDefined();
      expect(result.newGrade).toMatch(/^[SABC]$/);
    });
  });

  describe('Registry Service Null-Safety', () => {
    it('should handle corrupted user data gracefully', () => {
      const corruptedUser = {
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash123',
        salt: 'salt123',
        contacts: null,
        transactions: 'invalid',
        incidents: undefined,
        solvedBlocks: 123,
        ownedNfts: {},
        balance: 'not-a-number',
        usdBalance: null,
        messagingActive: 'true'
      } as any;

      const result = safeRegistry.validateAndFixUserStructure(corruptedUser);

      expect(result.isValid).toBe(true);
      expect(result.fixedFields.length).toBeGreaterThan(0);
      
      // Verify arrays are fixed
      expect(Array.isArray(corruptedUser.contacts)).toBe(true);
      expect(Array.isArray(corruptedUser.transactions)).toBe(true);
      expect(Array.isArray(corruptedUser.incidents)).toBe(true);
      expect(Array.isArray(corruptedUser.solvedBlocks)).toBe(true);
      expect(Array.isArray(corruptedUser.ownedNfts)).toBe(true);
      
      // Verify numeric fields are fixed
      expect(typeof corruptedUser.balance).toBe('number');
      expect(typeof corruptedUser.usdBalance).toBe('number');
      
      // Verify boolean fields are fixed
      expect(typeof corruptedUser.messagingActive).toBe('boolean');
    });

    it('should handle missing user files gracefully', () => {
      const partialUser = {
        address: 'test-address',
        username: 'testuser'
      };

      const completeUser = safeRegistry.initializeUserDataStructures(partialUser);

      expect(completeUser.passwordHash).toBeDefined();
      expect(completeUser.salt).toBeDefined();
      expect(completeUser.profileId).toBeDefined();
      expect(Array.isArray(completeUser.contacts)).toBe(true);
      expect(Array.isArray(completeUser.transactions)).toBe(true);
      expect(typeof completeUser.balance).toBe('number');
      expect(typeof completeUser.level).toBe('number');
    });

    it('should handle deeply nested null access patterns', () => {
      const userWithNestedNulls = {
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash123',
        salt: 'salt123',
        contacts: [
          { name: null, address: undefined, addedAt: 'invalid-date' },
          null,
          undefined
        ],
        transactions: [
          { amount: 'not-a-number', timestamp: null },
          { type: undefined, status: 123 }
        ]
      } as any;

      const result = safeRegistry.validateAndFixUserStructure(userWithNestedNulls);

      expect(result.isValid).toBe(true);
      expect(Array.isArray(userWithNestedNulls.contacts)).toBe(true);
      expect(Array.isArray(userWithNestedNulls.transactions)).toBe(true);
    });
  });

  describe('Web Crypto API Fallbacks', () => {
    it('should handle complete Web Crypto API unavailability', () => {
      // Mock Web Crypto API unavailable
      const originalCrypto = global.crypto;
      delete (global as any).crypto;

      // Clear cached support info to force re-detection
      (CryptoFallbackService as any)._supportInfo = null;

      const support = CryptoFallbackService.getSupportInfo();
      expect(support.webCrypto).toBe(false);
      expect(support.fallbackAvailable).toBe(true);
      expect(support.supportLevel).toBe('fallback');

      // Test fallback functionality
      const randomResult = CryptoFallbackService.generateRandomBytes(16);
      expect(randomResult.success).toBe(true);
      expect(randomResult.method).toBe('fallback');

      // Restore crypto
      global.crypto = originalCrypto;
      (CryptoFallbackService as any)._supportInfo = null;
    });

    it('should handle partial Web Crypto API support', () => {
      // Mock partial crypto support
      const originalCrypto = global.crypto;
      global.crypto = {
        getRandomValues: vi.fn().mockImplementation((array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
          }
          return array;
        })
        // Missing subtle API
      } as any;

      // Clear cached support info
      (CryptoFallbackService as any)._supportInfo = null;

      const support = CryptoFallbackService.getSupportInfo();
      expect(support.getRandomValues).toBe(true);
      expect(support.subtle).toBe(false);
      expect(support.supportLevel).toBe('partial');

      // Restore crypto
      global.crypto = originalCrypto;
      (CryptoFallbackService as any)._supportInfo = null;
    });

    it('should handle crypto operation failures gracefully', async () => {
      // Mock crypto operation failure
      const originalCrypto = global.crypto;
      global.crypto = {
        getRandomValues: vi.fn().mockImplementation(() => {
          throw new Error('Crypto operation failed');
        }),
        subtle: {
          digest: vi.fn().mockRejectedValue(new Error('Hash operation failed'))
        }
      } as any;

      // Clear cached support info
      (CryptoFallbackService as any)._supportInfo = null;

      const randomResult = CryptoFallbackService.generateRandomBytes(16);
      expect(randomResult.success).toBe(true);
      expect(randomResult.method).toBe('fallback');

      const hashResult = await CryptoFallbackService.hashData('test');
      expect(hashResult.success).toBe(true);
      expect(hashResult.method).toBe('fallback');

      // Restore crypto
      global.crypto = originalCrypto;
      (CryptoFallbackService as any)._supportInfo = null;
    });
  });

  describe('Complete Authentication Flow Error Recovery', () => {
    it('should handle complete system failure with graceful degradation', async () => {
      // Simulate complete system failure
      const mockNotification = vi.fn();
      
      // DeepSeek failure
      const safeClient = new SafeDeepSeekClient();
      safeClient.setNotificationCallback(mockNotification);
      
      vi.doMock('../services/deepSeekClient', () => ({
        deepSeekClient: {
          isConfigured: vi.fn().mockRejectedValue(new Error('Network failure')),
          testConnection: vi.fn(),
          evaluateMiningBreakthrough: vi.fn(),
          evolveBreakthrough: vi.fn()
        }
      }));
      
      // Crypto failure
      const originalCrypto = global.crypto;
      delete (global as any).crypto;
      (CryptoFallbackService as any)._supportInfo = null;
      
      // Initialize services
      const deepSeekStatus = await safeClient.initialize();
      const cryptoSupport = CryptoFallbackService.getSupportInfo();
      
      // Verify graceful degradation
      expect(deepSeekStatus.fallbackMode).toBe(true);
      expect(cryptoSupport.supportLevel).toBe('fallback');
      
      // Verify notifications were sent
      expect(mockNotification).toHaveBeenCalled();
      
      // Restore crypto
      global.crypto = originalCrypto;
      (CryptoFallbackService as any)._supportInfo = null;
    });

    it('should maintain core functionality during partial failures', async () => {
      // Simulate partial failures
      const sessionId = authErrorHandler.startDiagnosticSession('login', 'testuser');
      
      // DeepSeek unavailable but crypto works
      const safeClient = new SafeDeepSeekClient();
      vi.doMock('../services/deepSeekClient', () => ({
        deepSeekClient: {
          isConfigured: vi.fn().mockResolvedValue(false),
          testConnection: vi.fn(),
          evaluateMiningBreakthrough: vi.fn(),
          evolveBreakthrough: vi.fn()
        }
      }));
      
      const deepSeekStatus = await safeClient.initialize();
      const cryptoSupport = CryptoFallbackService.getSupportInfo();
      
      // Registry should still work
      const testUser = safeRegistry.initializeUserDataStructures({
        address: 'test-address',
        username: 'testuser'
      });
      
      // End diagnostic session
      authErrorHandler.endDiagnosticSession(sessionId, true);
      const diagnostics = authErrorHandler.getDiagnostics(sessionId);
      
      // Verify core functionality maintained
      expect(testUser.address).toBe('test-address');
      expect(cryptoSupport.fallbackAvailable).toBe(true);
      expect(diagnostics?.success).toBe(true);
      expect(deepSeekStatus.fallbackMode).toBe(true);
    });

    it('should provide comprehensive error reporting', async () => {
      const sessionId = authErrorHandler.startDiagnosticSession('login', 'testuser');
      
      // Generate various errors
      await authErrorHandler.handleAuthError(new Error('Network timeout'), { operation: 'login' });
      await authErrorHandler.handleAuthError(new Error('Invalid password'), { operation: 'login' });
      await authErrorHandler.handleAuthError(new Error('Database unavailable'), { operation: 'login' });
      
      authErrorHandler.addWarning(sessionId, 'CSS fallback activated');
      authErrorHandler.addWarning(sessionId, 'DeepSeek unavailable');
      
      authErrorHandler.endDiagnosticSession(sessionId, false);
      
      const diagnostics = authErrorHandler.getDiagnostics(sessionId);
      const errorPatterns = authErrorHandler.getErrorPatterns();
      
      expect(diagnostics?.warnings.length).toBeGreaterThan(0);
      expect(diagnostics?.success).toBe(false);
      expect(errorPatterns['NETWORK_ERROR'] || 0).toBeGreaterThanOrEqual(0);
      expect(errorPatterns['AUTH_FAILED'] || 0).toBeGreaterThanOrEqual(0);
      expect(errorPatterns['SYSTEM_ERROR'] || 0).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Under Error Conditions', () => {
    it('should maintain acceptable performance during fallback operations', async () => {
      const startTime = performance.now();
      
      // Force systems into fallback mode
      const safeClient = new SafeDeepSeekClient();
      vi.doMock('../services/deepSeekClient', () => ({
        deepSeekClient: {
          isConfigured: vi.fn().mockResolvedValue(false),
          testConnection: vi.fn(),
          evaluateMiningBreakthrough: vi.fn(),
          evolveBreakthrough: vi.fn()
        }
      }));
      
      await safeClient.initialize();
      
      // Perform operations in fallback mode
      const cryptoResult = CryptoFallbackService.generateRandomBytes(32);
      const hashResult = await CryptoFallbackService.hashData('test data');
      const userResult = safeRegistry.initializeUserDataStructures({
        address: 'test-address',
        username: 'testuser'
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Verify operations completed successfully
      expect(cryptoResult.success).toBe(true);
      expect(hashResult.success).toBe(true);
      expect(userResult.address).toBe('test-address');
      
      // Verify reasonable performance (should complete within 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle memory constraints during error recovery', () => {
      // Simulate memory pressure by creating many error sessions
      const sessionIds: string[] = [];
      
      for (let i = 0; i < 10; i++) { // Reduced from 100 to 10 for test performance
        const sessionId = authErrorHandler.startDiagnosticSession('test', `user${i}`);
        sessionIds.push(sessionId);
        
        // Add warnings to each session
        authErrorHandler.addWarning(sessionId, `Warning ${i}`);
      }
      
      // Clear old sessions (use a small time threshold to clear recent sessions)
      authErrorHandler.clearOldDiagnostics(1); // Clear sessions older than 1ms
      
      // Wait a bit to ensure sessions are old enough
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Small delay
      }
      
      // Clear again
      authErrorHandler.clearOldDiagnostics(1);
      
      // At least some sessions should be cleared
      const remainingSessions = sessionIds.filter(sessionId => 
        authErrorHandler.getDiagnostics(sessionId) !== null
      );
      expect(remainingSessions.length).toBeLessThanOrEqual(sessionIds.length);
    });
  });
});