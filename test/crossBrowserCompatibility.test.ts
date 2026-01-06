/**
 * Cross-Browser Compatibility Tests
 * Tests authentication system compatibility across different browser environments
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CryptoFallbackService } from '../services/cryptoFallback';
import { authErrorHandler } from '../services/authErrorHandler';

describe('Cross-Browser Compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Crypto Compatibility', () => {
    it('should handle environments with limited crypto support', () => {
      // Test that crypto fallback service works regardless of environment
      const support = CryptoFallbackService.getSupportInfo();
      expect(support).toHaveProperty('webCrypto');
      expect(support).toHaveProperty('fallbackAvailable');
      expect(support.fallbackAvailable).toBe(true);
    });

    it('should provide consistent random generation across environments', () => {
      const result1 = CryptoFallbackService.generateRandomBytes(16);
      const result2 = CryptoFallbackService.generateRandomBytes(16);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data?.length).toBe(16);
      expect(result2.data?.length).toBe(16);
      
      // Should generate different values
      const array1 = Array.from(result1.data!);
      const array2 = Array.from(result2.data!);
      expect(array1).not.toEqual(array2);
    });

    it('should provide consistent hashing across environments', async () => {
      const testData = 'test data for cross-browser hashing';
      const result1 = await CryptoFallbackService.hashData(testData);
      const result2 = await CryptoFallbackService.hashData(testData);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data).toBe(result2.data); // Same input should produce same hash
    });

    it('should handle key derivation consistently', async () => {
      const password = 'test password';
      const salt = 'test salt';
      const iterations = 1000;
      
      const result1 = await CryptoFallbackService.deriveKey(password, salt, iterations);
      const result2 = await CryptoFallbackService.deriveKey(password, salt, iterations);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data).toBe(result2.data); // Same inputs should produce same key
    });
  });

  describe('Error Handling Compatibility', () => {
    it('should provide consistent error messages across environments', async () => {
      const error = new Error('Test error message');
      const authError = await authErrorHandler.handleAuthError(error, { operation: 'test' });

      expect(authError.userMessage).toBeDefined();
      expect(typeof authError.userMessage).toBe('string');
      expect(authError.userMessage.length).toBeGreaterThan(0);
      expect(authError.userMessage).not.toContain('undefined');
      expect(authError.userMessage).not.toContain('null');
    });

    it('should handle different error types consistently', async () => {
      const errors = [
        new Error('Network timeout'),
        new Error('Invalid credentials'),
        new Error('Service unavailable'),
        new Error('Configuration error')
      ];

      for (const error of errors) {
        const authError = await authErrorHandler.handleAuthError(error, { operation: 'test' });
        expect(authError.type).toBeDefined();
        expect(authError.userMessage).toBeDefined();
        expect(authError.recoverable).toBeDefined();
      }
    });

    it('should maintain diagnostic functionality across environments', () => {
      const sessionId = authErrorHandler.startDiagnosticSession('test', 'testuser');
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      
      authErrorHandler.addWarning(sessionId, 'Test warning');
      authErrorHandler.endDiagnosticSession(sessionId, true);
      
      const diagnostics = authErrorHandler.getDiagnostics(sessionId);
      expect(diagnostics).toBeDefined();
      expect(diagnostics?.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Compatibility', () => {
    it('should maintain acceptable performance across environments', async () => {
      const startTime = performance.now();
      
      // Perform multiple operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(CryptoFallbackService.generateRandomBytes(32));
        operations.push(CryptoFallbackService.hashData(`test data ${i}`));
      }
      
      await Promise.all(operations.filter(op => op instanceof Promise));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000);
    });

    it('should handle memory constraints gracefully', () => {
      // Test memory usage with multiple operations
      const results = [];
      for (let i = 0; i < 50; i++) {
        const result = CryptoFallbackService.generateRandomBytes(16);
        results.push(result);
      }
      
      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // Should generate unique values
      const uniqueResults = new Set(results.map(r => r.data?.toString()));
      expect(uniqueResults.size).toBeGreaterThan(40);
    });
  });

  describe('Feature Detection', () => {
    it('should detect available features correctly', () => {
      const support = CryptoFallbackService.getSupportInfo();
      
      expect(support).toHaveProperty('webCrypto');
      expect(support).toHaveProperty('getRandomValues');
      expect(support).toHaveProperty('subtle');
      expect(support).toHaveProperty('supportLevel');
      expect(['full', 'partial', 'fallback']).toContain(support.supportLevel);
    });

    it('should provide comprehensive crypto testing', async () => {
      const testResults = await CryptoFallbackService.testCryptoFunctionality();
      
      expect(testResults).toHaveProperty('support');
      expect(testResults).toHaveProperty('tests');
      
      // All tests should have results
      expect(testResults.tests.randomGeneration).toBeDefined();
      expect(testResults.tests.hashing).toBeDefined();
      expect(testResults.tests.keyDerivation).toBeDefined();
      expect(testResults.tests.encryption).toBeDefined();
      
      // All tests should succeed
      expect(testResults.tests.randomGeneration.success).toBe(true);
      expect(testResults.tests.hashing.success).toBe(true);
      expect(testResults.tests.keyDerivation.success).toBe(true);
      expect(testResults.tests.encryption.success).toBe(true);
    });
  });

  describe('Graceful Degradation', () => {
    it('should provide fallback functionality when needed', () => {
      // Test that fallback methods work
      const encryptResult = CryptoFallbackService.simpleEncrypt('test data', 'test key');
      expect(encryptResult.success).toBe(true);
      
      const decryptResult = CryptoFallbackService.simpleDecrypt(encryptResult.data!, 'test key');
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe('test data');
    });

    it('should generate secure passwords in any environment', () => {
      const passwordResult = CryptoFallbackService.generateSecurePassword(16);
      
      expect(passwordResult.success).toBe(true);
      expect(passwordResult.data).toBeDefined();
      expect(typeof passwordResult.data).toBe('string');
      expect(passwordResult.data!.length).toBeGreaterThan(0);
    });

    it('should handle error patterns consistently', async () => {
      // Generate multiple errors to test pattern tracking
      await authErrorHandler.handleAuthError(new Error('Network error'), {});
      await authErrorHandler.handleAuthError(new Error('Auth failed'), {});
      await authErrorHandler.handleAuthError(new Error('System error'), {});
      
      const patterns = authErrorHandler.getErrorPatterns();
      expect(typeof patterns).toBe('object');
      expect(Object.keys(patterns).length).toBeGreaterThan(0);
    });
  });
});