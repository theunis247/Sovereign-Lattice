/**
 * Database Initialization and Recovery System Tests
 */

import { describe, it, expect } from 'vitest';
import { safeRegistry } from '../services/safeRegistryService';

describe('Database Initialization System', () => {
  describe('User Data Validation', () => {
    it('should validate and fix user data structure', () => {
      const invalidUser = {
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash',
        salt: 'salt',
        // Missing required arrays and fields
      };

      const validationResult = safeRegistry.validateAndFixUserStructure(invalidUser as any);
      
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.fixedFields.length).toBeGreaterThan(0);
      
      // Check that arrays were initialized
      expect(Array.isArray(invalidUser.contacts)).toBe(true);
      expect(Array.isArray(invalidUser.transactions)).toBe(true);
      expect(Array.isArray(invalidUser.incidents)).toBe(true);
      expect(Array.isArray(invalidUser.solvedBlocks)).toBe(true);
      expect(Array.isArray(invalidUser.ownedNfts)).toBe(true);
    });

    it('should create user with safe defaults', () => {
      const partialData = {
        username: 'testuser',
        address: 'test-address'
      };

      const user = safeRegistry.initializeUserDataStructures(partialData);
      
      expect(user.username).toBe('testuser');
      expect(user.address).toBe('test-address');
      expect(user.balance).toBe(0);
      expect(user.level).toBe(1);
      expect(user.role).toBe('user');
      expect(Array.isArray(user.contacts)).toBe(true);
      expect(Array.isArray(user.transactions)).toBe(true);
      expect(typeof user.votes).toBe('object');
    });
  });

  describe('Safe Registry Operations', () => {
    it('should validate user structure correctly', () => {
      const validUser = safeRegistry.initializeUserDataStructures({
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash',
        salt: 'salt'
      });

      const isValid = safeRegistry.isValidUserStructure(validUser);
      expect(isValid).toBe(true);
    });

    it('should reject invalid user structures', () => {
      const invalidUser = {
        // Missing required fields
        username: 'testuser'
      };

      const isValid = safeRegistry.isValidUserStructure(invalidUser);
      expect(isValid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted user data gracefully', () => {
      const corruptedUser = {
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash',
        salt: 'salt',
        contacts: 'invalid-array', // Should be array
        balance: 'invalid-number', // Should be number
        votes: 'invalid-object' // Should be object
      };

      const validationResult = safeRegistry.validateAndFixUserStructure(corruptedUser as any);
      
      expect(validationResult.fixedFields.length).toBeGreaterThan(0);
      expect(Array.isArray(corruptedUser.contacts)).toBe(true);
      expect(typeof corruptedUser.balance).toBe('number');
      expect(typeof corruptedUser.votes).toBe('object');
    });

    it('should handle missing user properties', () => {
      const incompleteUser = {
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash',
        salt: 'salt'
        // Missing many properties
      };

      const validationResult = safeRegistry.validateAndFixUserStructure(incompleteUser as any);
      
      expect(validationResult.fixedFields.length).toBeGreaterThan(0);
      expect(validationResult.isValid).toBe(true);
      
      // Check that missing properties were added
      expect(incompleteUser).toHaveProperty('contacts');
      expect(incompleteUser).toHaveProperty('transactions');
      expect(incompleteUser).toHaveProperty('balance');
      expect(incompleteUser).toHaveProperty('level');
    });

    it('should initialize all required user fields with proper types', () => {
      const minimalUser = {
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash',
        salt: 'salt'
      };

      const user = safeRegistry.initializeUserDataStructures(minimalUser);
      
      // Check all required fields exist with correct types
      expect(typeof user.address).toBe('string');
      expect(typeof user.username).toBe('string');
      expect(typeof user.passwordHash).toBe('string');
      expect(typeof user.salt).toBe('string');
      expect(typeof user.role).toBe('string');
      expect(typeof user.balance).toBe('number');
      expect(typeof user.level).toBe('number');
      expect(typeof user.xp).toBe('number');
      expect(typeof user.messagingActive).toBe('boolean');
      expect(typeof user.miningActive).toBe('boolean');
      expect(typeof user.discoveryVisible).toBe('boolean');
      
      // Check arrays
      expect(Array.isArray(user.contacts)).toBe(true);
      expect(Array.isArray(user.transactions)).toBe(true);
      expect(Array.isArray(user.incidents)).toBe(true);
      expect(Array.isArray(user.solvedBlocks)).toBe(true);
      expect(Array.isArray(user.ownedNfts)).toBe(true);
      expect(Array.isArray(user.milestones)).toBe(true);
      expect(Array.isArray(user.groups)).toBe(true);
      
      // Check objects
      expect(typeof user.votes).toBe('object');
      expect(user.votes).not.toBeNull();
    });
  });

  describe('Data Structure Validation', () => {
    it('should validate nested array structures', () => {
      const user = safeRegistry.initializeUserDataStructures({
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash',
        salt: 'salt'
      });

      // Add some test data to arrays
      user.contacts.push({
        name: 'Test Contact',
        address: 'contact-address',
        addedAt: new Date().toISOString()
      });

      user.transactions.push({
        id: 'test-tx',
        timestamp: new Date().toISOString(),
        type: 'CREDIT',
        amount: '100',
        unit: 'QBS',
        description: 'Test transaction'
      });

      const validationResult = safeRegistry.validateAndFixUserStructure(user);
      
      expect(validationResult.isValid).toBe(true);
      expect(user.contacts.length).toBe(1);
      expect(user.transactions.length).toBe(1);
    });

    it('should handle numeric field validation', () => {
      const user = {
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash',
        salt: 'salt',
        balance: 'not-a-number',
        level: 'also-not-a-number',
        xp: null
      };

      const validationResult = safeRegistry.validateAndFixUserStructure(user as any);
      
      expect(validationResult.fixedFields).toContain('balance');
      expect(validationResult.fixedFields).toContain('level');
      expect(validationResult.fixedFields).toContain('xp');
      
      expect(typeof user.balance).toBe('number');
      expect(typeof user.level).toBe('number');
      expect(typeof user.xp).toBe('number');
      expect(user.level).toBe(1); // Default level
      expect(user.balance).toBe(0); // Default balance
    });
  });
});