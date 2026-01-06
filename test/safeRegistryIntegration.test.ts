/**
 * Safe Registry Integration Tests
 * Tests integration between safe registry service and database operations
 */

import { expect } from 'vitest';
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
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { safeRegistry } from '../services/safeRegistryService';
import { User } from '../types';

describe('Safe Registry Integration', () => {
  const testUser: User = {
    address: 'test-safe-registry-addr',
    publicKey: 'test-pub-key',
    privateKey: 'test-priv-key',
    profileId: 'test-safe-profile',
    username: 'saferegistrytest',
    passwordHash: 'test-hash',
    salt: 'test-salt',
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

  it('should validate user structure directly', () => {
    // Test valid user
    expect(safeRegistry.isValidUserStructure(testUser)).toBe(true);

    // Test invalid users
    expect(safeRegistry.isValidUserStructure(null)).toBe(false);
    expect(safeRegistry.isValidUserStructure(undefined)).toBe(false);
    expect(safeRegistry.isValidUserStructure({})).toBe(false);
    expect(safeRegistry.isValidUserStructure('string')).toBe(false);

    // Test user with missing required fields
    const invalidUser = { username: 'test' };
    expect(safeRegistry.isValidUserStructure(invalidUser)).toBe(false);
  });

  it('should initialize user data structures', () => {
    const partialUser = {
      address: 'test-addr',
      username: 'testuser',
      passwordHash: 'hash123',
      salt: 'salt123'
    };

    const completeUser = safeRegistry.initializeUserDataStructures(partialUser);

    expect(completeUser.address).toBe('test-addr');
    expect(completeUser.username).toBe('testuser');
    expect(Array.isArray(completeUser.contacts)).toBe(true);
    expect(Array.isArray(completeUser.transactions)).toBe(true);
    expect(Array.isArray(completeUser.incidents)).toBe(true);
    expect(Array.isArray(completeUser.solvedBlocks)).toBe(true);
    expect(Array.isArray(completeUser.ownedNfts)).toBe(true);
    expect(typeof completeUser.balance).toBe('number');
    expect(typeof completeUser.usdBalance).toBe('number');
  });

  it('should validate and fix user structure', () => {
    const incompleteUser = {
      address: 'test-address',
      username: 'testuser',
      passwordHash: 'hash123',
      salt: 'salt123',
      // Missing arrays and other fields
    } as Partial<User>;

    const result = safeRegistry.validateAndFixUserStructure(incompleteUser as User);

    expect(result.isValid).toBe(true);
    expect(result.fixedFields.length).toBeGreaterThan(0);
    expect(Array.isArray((incompleteUser as User).contacts)).toBe(true);
    expect(Array.isArray((incompleteUser as User).transactions)).toBe(true);
    expect(typeof (incompleteUser as User).balance).toBe('number');
  });
});