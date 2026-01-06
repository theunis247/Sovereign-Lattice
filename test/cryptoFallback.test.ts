/**
 * Tests for Crypto Fallback Service
 * Verifies Web Crypto API detection and fallback mechanisms
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CryptoFallbackService, cryptoFallback } from '../services/cryptoFallback';

describe('CryptoFallbackService', () => {
  beforeEach(() => {
    // Reset the cached support info before each test
    (CryptoFallbackService as any)._supportInfo = null;
  });

  describe('getSupportInfo', () => {
    it('should detect Web Crypto API support correctly', () => {
      const support = CryptoFallbackService.getSupportInfo();
      
      expect(support).toHaveProperty('webCrypto');
      expect(support).toHaveProperty('getRandomValues');
      expect(support).toHaveProperty('subtle');
      expect(support).toHaveProperty('fallbackAvailable');
      expect(support).toHaveProperty('supportLevel');
      
      expect(support.fallbackAvailable).toBe(true);
      expect(['full', 'partial', 'fallback']).toContain(support.supportLevel);
    });

    it('should cache support information', () => {
      const support1 = CryptoFallbackService.getSupportInfo();
      const support2 = CryptoFallbackService.getSupportInfo();
      
      expect(support1).toBe(support2); // Same object reference
    });
  });

  describe('generateRandomBytes', () => {
    it('should generate random bytes of specified length', () => {
      const result = CryptoFallbackService.generateRandomBytes(16);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(result.data?.length).toBe(16);
      expect(['webcrypto', 'fallback', 'basic']).toContain(result.method);
    });

    it('should generate different random values on subsequent calls', () => {
      const result1 = CryptoFallbackService.generateRandomBytes(16);
      const result2 = CryptoFallbackService.generateRandomBytes(16);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      // Arrays should be different (extremely unlikely to be the same)
      const array1 = Array.from(result1.data!);
      const array2 = Array.from(result2.data!);
      expect(array1).not.toEqual(array2);
    });

    it('should handle zero length gracefully', () => {
      const result = CryptoFallbackService.generateRandomBytes(0);
      
      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(0);
    });
  });

  describe('hashData', () => {
    it('should hash data consistently', async () => {
      const testData = 'test data for hashing';
      const result1 = await CryptoFallbackService.hashData(testData);
      const result2 = await CryptoFallbackService.hashData(testData);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data).toBe(result2.data); // Same input should produce same hash
      expect(result1.data?.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for different inputs', async () => {
      const result1 = await CryptoFallbackService.hashData('input1');
      const result2 = await CryptoFallbackService.hashData('input2');
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data).not.toBe(result2.data);
    });

    it('should handle empty string', async () => {
      const result = await CryptoFallbackService.hashData('');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('deriveKey', () => {
    it('should derive keys consistently', async () => {
      const password = 'test password';
      const salt = 'test salt';
      const iterations = 1000;
      
      const result1 = await CryptoFallbackService.deriveKey(password, salt, iterations);
      const result2 = await CryptoFallbackService.deriveKey(password, salt, iterations);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data).toBe(result2.data); // Same inputs should produce same key
    });

    it('should produce different keys for different passwords', async () => {
      const salt = 'test salt';
      const iterations = 1000;
      
      const result1 = await CryptoFallbackService.deriveKey('password1', salt, iterations);
      const result2 = await CryptoFallbackService.deriveKey('password2', salt, iterations);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data).not.toBe(result2.data);
    });

    it('should produce different keys for different salts', async () => {
      const password = 'test password';
      const iterations = 1000;
      
      const result1 = await CryptoFallbackService.deriveKey(password, 'salt1', iterations);
      const result2 = await CryptoFallbackService.deriveKey(password, 'salt2', iterations);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data).not.toBe(result2.data);
    });
  });

  describe('simpleEncrypt and simpleDecrypt', () => {
    it('should encrypt and decrypt data correctly', () => {
      const testData = 'sensitive information';
      const key = 'encryption key';
      
      const encryptResult = CryptoFallbackService.simpleEncrypt(testData, key);
      expect(encryptResult.success).toBe(true);
      expect(encryptResult.data).toBeDefined();
      expect(encryptResult.data).not.toBe(testData); // Should be encrypted
      
      const decryptResult = CryptoFallbackService.simpleDecrypt(encryptResult.data!, key);
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(testData); // Should match original
    });

    it('should fail to decrypt with wrong key', () => {
      const testData = 'sensitive information';
      const correctKey = 'correct key';
      const wrongKey = 'wrong key';
      
      const encryptResult = CryptoFallbackService.simpleEncrypt(testData, correctKey);
      expect(encryptResult.success).toBe(true);
      
      const decryptResult = CryptoFallbackService.simpleDecrypt(encryptResult.data!, wrongKey);
      expect(decryptResult.success).toBe(true); // XOR doesn't fail, just produces wrong result
      expect(decryptResult.data).not.toBe(testData); // Should not match original
    });

    it('should handle empty data', () => {
      const key = 'test key';
      
      const encryptResult = CryptoFallbackService.simpleEncrypt('', key);
      expect(encryptResult.success).toBe(true);
      
      const decryptResult = CryptoFallbackService.simpleDecrypt(encryptResult.data!, key);
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe('');
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate passwords of specified length', () => {
      const result = CryptoFallbackService.generateSecurePassword(16);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it('should generate different passwords on subsequent calls', () => {
      const result1 = CryptoFallbackService.generateSecurePassword(16);
      const result2 = CryptoFallbackService.generateSecurePassword(16);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data).not.toBe(result2.data);
    });
  });

  describe('testCryptoFunctionality', () => {
    it('should run all crypto tests and return results', async () => {
      const testResults = await CryptoFallbackService.testCryptoFunctionality();
      
      expect(testResults).toHaveProperty('support');
      expect(testResults).toHaveProperty('tests');
      
      expect(testResults.tests).toHaveProperty('randomGeneration');
      expect(testResults.tests).toHaveProperty('hashing');
      expect(testResults.tests).toHaveProperty('keyDerivation');
      expect(testResults.tests).toHaveProperty('encryption');
      
      // All tests should succeed
      expect(testResults.tests.randomGeneration.success).toBe(true);
      expect(testResults.tests.hashing.success).toBe(true);
      expect(testResults.tests.keyDerivation.success).toBe(true);
      expect(testResults.tests.encryption.success).toBe(true);
    });
  });

  describe('convenience functions', () => {
    it('should provide working convenience functions', async () => {
      // Test randomBytes
      const randomResult = cryptoFallback.randomBytes(16);
      expect(randomResult.success).toBe(true);
      expect(randomResult.data?.length).toBe(16);
      
      // Test hash
      const hashResult = await cryptoFallback.hash('test');
      expect(hashResult.success).toBe(true);
      expect(hashResult.data).toBeDefined();
      
      // Test deriveKey
      const keyResult = await cryptoFallback.deriveKey('password', 'salt');
      expect(keyResult.success).toBe(true);
      expect(keyResult.data).toBeDefined();
      
      // Test generatePassword
      const passwordResult = cryptoFallback.generatePassword();
      expect(passwordResult.success).toBe(true);
      expect(passwordResult.data).toBeDefined();
      
      // Test getSupport
      const support = cryptoFallback.getSupport();
      expect(support).toHaveProperty('supportLevel');
      
      // Test test function
      const testResult = await cryptoFallback.test();
      expect(testResult).toHaveProperty('support');
      expect(testResult).toHaveProperty('tests');
    });
  });
});