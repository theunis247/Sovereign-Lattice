/**
 * Safe Registry Service Tests
 * Tests null-safe operations and defensive programming patterns
 */

import { safeRegistry } from '../services/safeRegistryService';
import { User } from '../types';

describe('SafeRegistryService', () => {
  describe('validateAndFixUserStructure', () => {
    it('should fix missing array fields', () => {
      const incompleteUser = {
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash123',
        salt: 'salt123',
        role: 'user',
        balance: 100,
        usdBalance: 1000,
        shardsTowardNextQBS: 0,
        messagingActive: true,
        miningActive: false,
        xp: 50,
        level: 2
        // Missing arrays: contacts, transactions, incidents, solvedBlocks, ownedNfts
      } as Partial<User>;

      const result = safeRegistry.validateAndFixUserStructure(incompleteUser as User);

      expect(result.isValid).toBe(true);
      expect(result.fixedFields).toContain('contacts');
      expect(result.fixedFields).toContain('transactions');
      expect(result.fixedFields).toContain('incidents');
      expect(result.fixedFields).toContain('solvedBlocks');
      expect(result.fixedFields).toContain('ownedNfts');
      
      expect(Array.isArray((incompleteUser as User).contacts)).toBe(true);
      expect(Array.isArray((incompleteUser as User).transactions)).toBe(true);
      expect(Array.isArray((incompleteUser as User).incidents)).toBe(true);
      expect(Array.isArray((incompleteUser as User).solvedBlocks)).toBe(true);
      expect(Array.isArray((incompleteUser as User).ownedNfts)).toBe(true);
    });

    it('should fix missing numeric fields with safe defaults', () => {
      const incompleteUser = {
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash123',
        salt: 'salt123',
        contacts: [],
        transactions: [],
        incidents: [],
        solvedBlocks: [],
        ownedNfts: [],
        messagingActive: true,
        miningActive: false
        // Missing: balance, usdBalance, shardsTowardNextQBS, xp, level
      } as Partial<User>;

      const result = safeRegistry.validateAndFixUserStructure(incompleteUser as User);

      expect(result.fixedFields).toContain('balance');
      expect(result.fixedFields).toContain('usdBalance');
      expect(result.fixedFields).toContain('shardsTowardNextQBS');
      expect(result.fixedFields).toContain('xp');
      expect(result.fixedFields).toContain('level');
      
      expect((incompleteUser as User).balance).toBe(0);
      expect((incompleteUser as User).usdBalance).toBe(0);
      expect((incompleteUser as User).shardsTowardNextQBS).toBe(0);
      expect((incompleteUser as User).xp).toBe(0);
      expect((incompleteUser as User).level).toBe(1);
    });

    it('should fix missing boolean fields with safe defaults', () => {
      const incompleteUser = {
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash123',
        salt: 'salt123',
        contacts: [],
        transactions: [],
        incidents: [],
        solvedBlocks: [],
        ownedNfts: [],
        balance: 0,
        usdBalance: 0,
        shardsTowardNextQBS: 0,
        xp: 0,
        level: 1
        // Missing: messagingActive, miningActive, discoveryVisible
      } as Partial<User>;

      const result = safeRegistry.validateAndFixUserStructure(incompleteUser as User);

      expect(result.fixedFields).toContain('messagingActive');
      expect(result.fixedFields).toContain('miningActive');
      expect(result.fixedFields).toContain('discoveryVisible');
      
      expect((incompleteUser as User).messagingActive).toBe(false);
      expect((incompleteUser as User).miningActive).toBe(false);
      expect((incompleteUser as User).discoveryVisible).toBe(true);
    });

    it('should detect missing required fields', () => {
      const invalidUser = {
        username: 'testuser',
        // Missing: address, passwordHash, salt
        contacts: [],
        transactions: [],
        incidents: [],
        solvedBlocks: [],
        ownedNfts: []
      } as Partial<User>;

      const result = safeRegistry.validateAndFixUserStructure(invalidUser as User);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or invalid required field: address');
      expect(result.errors).toContain('Missing or invalid required field: passwordHash');
      expect(result.errors).toContain('Missing or invalid required field: salt');
    });

    it('should handle null/undefined arrays gracefully', () => {
      const userWithNullArrays = {
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash123',
        salt: 'salt123',
        contacts: null,
        transactions: undefined,
        incidents: 'invalid',
        solvedBlocks: 123,
        ownedNfts: {},
        balance: 0,
        usdBalance: 0,
        shardsTowardNextQBS: 0,
        messagingActive: true,
        miningActive: false,
        xp: 0,
        level: 1
      } as any;

      const result = safeRegistry.validateAndFixUserStructure(userWithNullArrays);

      expect(result.fixedFields).toContain('contacts');
      expect(result.fixedFields).toContain('transactions');
      expect(result.fixedFields).toContain('incidents');
      expect(result.fixedFields).toContain('solvedBlocks');
      expect(result.fixedFields).toContain('ownedNfts');
      
      expect(Array.isArray(userWithNullArrays.contacts)).toBe(true);
      expect(Array.isArray(userWithNullArrays.transactions)).toBe(true);
      expect(Array.isArray(userWithNullArrays.incidents)).toBe(true);
      expect(Array.isArray(userWithNullArrays.solvedBlocks)).toBe(true);
      expect(Array.isArray(userWithNullArrays.ownedNfts)).toBe(true);
    });
  });

  describe('initializeUserDataStructures', () => {
    it('should create a complete user from partial data', () => {
      const partialUser = {
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash123',
        salt: 'salt123'
      };

      const completeUser = safeRegistry.initializeUserDataStructures(partialUser);

      expect(completeUser.address).toBe('test-address');
      expect(completeUser.username).toBe('testuser');
      expect(completeUser.passwordHash).toBe('hash123');
      expect(completeUser.salt).toBe('salt123');
      
      // Check all arrays are initialized
      expect(Array.isArray(completeUser.contacts)).toBe(true);
      expect(Array.isArray(completeUser.transactions)).toBe(true);
      expect(Array.isArray(completeUser.incidents)).toBe(true);
      expect(Array.isArray(completeUser.solvedBlocks)).toBe(true);
      expect(Array.isArray(completeUser.ownedNfts)).toBe(true);
      expect(Array.isArray(completeUser.milestones)).toBe(true);
      expect(Array.isArray(completeUser.groups)).toBe(true);
      
      // Check numeric defaults
      expect(completeUser.balance).toBe(0);
      expect(completeUser.usdBalance).toBe(0);
      expect(completeUser.shardsTowardNextQBS).toBe(0);
      expect(completeUser.xp).toBe(0);
      expect(completeUser.level).toBe(1);
      
      // Check boolean defaults
      expect(completeUser.messagingActive).toBe(false);
      expect(completeUser.miningActive).toBe(false);
      expect(completeUser.discoveryVisible).toBe(true);
      
      // Check string defaults
      expect(completeUser.role).toBe('user');
      expect(typeof completeUser.profileId).toBe('string');
      expect(completeUser.profileId.length).toBeGreaterThan(0);
    });

    it('should preserve existing values when provided', () => {
      const partialUser = {
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash123',
        salt: 'salt123',
        balance: 500,
        xp: 1000,
        level: 5,
        messagingActive: true,
        contacts: [{ name: 'Friend', address: 'friend-addr', addedAt: '2023-01-01' }]
      };

      const completeUser = safeRegistry.initializeUserDataStructures(partialUser);

      expect(completeUser.balance).toBe(500);
      expect(completeUser.xp).toBe(1000);
      expect(completeUser.level).toBe(5);
      expect(completeUser.messagingActive).toBe(true);
      expect(completeUser.contacts).toHaveLength(1);
      expect(completeUser.contacts[0].name).toBe('Friend');
    });
  });

  describe('isValidUserStructure', () => {
    it('should return true for valid user structure', () => {
      const validUser: User = {
        address: 'test-address',
        publicKey: 'pub-key',
        privateKey: 'priv-key',
        profileId: 'profile-123',
        username: 'testuser',
        passwordHash: 'hash123',
        salt: 'salt123',
        securityCode: '12345',
        role: 'user',
        balance: 100,
        usdBalance: 1000,
        contacts: [],
        transactions: [],
        incidents: [],
        solvedBlocks: [],
        ownedNfts: [],
        shardsTowardNextQBS: 0,
        messagingActive: true,
        miningActive: false,
        xp: 50,
        level: 2
      };

      expect(safeRegistry.isValidUserStructure(validUser)).toBe(true);
    });

    it('should return false for invalid user structure', () => {
      expect(safeRegistry.isValidUserStructure(null)).toBe(false);
      expect(safeRegistry.isValidUserStructure(undefined)).toBe(false);
      expect(safeRegistry.isValidUserStructure('string')).toBe(false);
      expect(safeRegistry.isValidUserStructure(123)).toBe(false);
      expect(safeRegistry.isValidUserStructure({})).toBe(false);
      
      // Missing required fields
      expect(safeRegistry.isValidUserStructure({
        username: 'test'
        // Missing address, passwordHash, salt
      })).toBe(false);
      
      // Invalid array fields
      expect(safeRegistry.isValidUserStructure({
        address: 'test-address',
        username: 'testuser',
        passwordHash: 'hash123',
        salt: 'salt123',
        contacts: 'not-an-array'
      })).toBe(false);
    });
  });
});