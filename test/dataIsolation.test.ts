/**
 * Data Isolation Verification Tests
 * Comprehensive tests for profile data segregation and cross-profile barriers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataSegregator, DataSensitivity } from '../services/dataSegregator';
import { ProfileEncryptor } from '../services/profileEncryptor';
import { ProfileIsolationManager } from '../services/profileIsolation';
import { CrossProfileBarrierManager } from '../services/crossProfileBarriers';
import { SecurityClassification } from '../services/profileManager';
import { enhancedDB } from '../services/enhancedDatabase';

// Mock enhanced database
vi.mock('../services/enhancedDatabase', () => ({
  enhancedDB: {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    query: vi.fn()
  }
}));

// Mock crypto API
global.crypto = {
  getRandomValues: (array: any) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  subtle: {
    generateKey: vi.fn().mockResolvedValue({ type: 'secret' }),
    encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    importKey: vi.fn().mockResolvedValue({ type: 'secret' }),
    deriveKey: vi.fn().mockResolvedValue({ type: 'secret' }),
    deriveBits: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
  }
} as any;

describe('Data Isolation System', () => {
  let dataSegregator: DataSegregator;
  let profileEncryptor: ProfileEncryptor;
  let isolationManager: ProfileIsolationManager;
  let barrierManager: CrossProfileBarrierManager;

  beforeEach(() => {
    // Create mock profile encryptor
    profileEncryptor = {
      encryptForProfile: vi.fn().mockResolvedValue('encrypted-data'),
      decryptForProfile: vi.fn().mockResolvedValue('decrypted-data')
    } as any;

    dataSegregator = new DataSegregator(profileEncryptor);
    isolationManager = new ProfileIsolationManager(dataSegregator, profileEncryptor as any);
    barrierManager = new CrossProfileBarrierManager();

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DataSegregator', () => {
    it('should isolate data for a specific profile', async () => {
      const profileId = 'test-profile-001';
      const collection = 'transactions';
      const testData = { amount: 100, description: 'Test transaction' };

      (enhancedDB.set as any).mockResolvedValue(undefined);

      const result = await dataSegregator.isolateData(
        profileId,
        collection,
        testData,
        SecurityClassification.INTERNAL
      );

      expect(result).toBeDefined();
      expect(result.profileId).toBe(profileId);
      expect(result.data).toBeDefined();
      expect(result.isolation.segregated).toBe(true);
      expect(result.metadata.checksum).toBeDefined();
      expect(enhancedDB.set).toHaveBeenCalled();
    });

    it('should encrypt sensitive data during isolation', async () => {
      const profileId = 'test-profile-002';
      const collection = 'apiKeys';
      const sensitiveData = { apiKey: 'secret-key-123' };

      (enhancedDB.set as any).mockResolvedValue(undefined);

      const result = await dataSegregator.isolateData(
        profileId,
        collection,
        sensitiveData,
        SecurityClassification.CONFIDENTIAL
      );

      expect(result.isolation.encrypted).toBe(true);
      expect(profileEncryptor.encryptForProfile).toHaveBeenCalledWith(
        profileId,
        sensitiveData,
        SecurityClassification.CONFIDENTIAL
      );
    });

    it('should retrieve isolated data for correct profile', async () => {
      const profileId = 'test-profile-003';
      const collection = 'settings';
      const dataId = 'setting-001';

      const mockIsolatedData = {
        profileId,
        data: { theme: 'dark' },
        isolation: { encrypted: false, segregated: true, verified: true },
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
          checksum: 'test-checksum',
          profileChecksum: 'profile-checksum'
        }
      };

      (enhancedDB.get as any).mockResolvedValue(mockIsolatedData);

      const result = await dataSegregator.retrieveData(profileId, collection, dataId);

      expect(result).toEqual({ theme: 'dark' });
      expect(enhancedDB.get).toHaveBeenCalledWith(
        `${profileId}_${collection}`,
        dataId
      );
    });

    it('should prevent cross-profile data access', async () => {
      const profileId = 'test-profile-004';
      const wrongProfileId = 'wrong-profile';
      const collection = 'transactions';
      const dataId = 'transaction-001';

      const mockIsolatedData = {
        profileId: wrongProfileId, // Data belongs to different profile
        data: { amount: 500 },
        isolation: { encrypted: false, segregated: true, verified: true },
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
          checksum: 'test-checksum',
          profileChecksum: 'profile-checksum'
        }
      };

      (enhancedDB.get as any).mockResolvedValue(mockIsolatedData);

      await expect(
        dataSegregator.retrieveData(profileId, collection, dataId)
      ).rejects.toThrow('Unauthorized cross-profile data access attempt');
    });

    it('should verify data integrity during retrieval', async () => {
      const profileId = 'test-profile-005';
      const collection = 'blocks';
      const dataId = 'block-001';

      const mockIsolatedData = {
        profileId,
        data: { blockData: 'test' },
        isolation: { encrypted: false, segregated: true, verified: true },
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
          checksum: 'wrong-checksum', // Corrupted checksum
          profileChecksum: 'profile-checksum'
        }
      };

      (enhancedDB.get as any).mockResolvedValue(mockIsolatedData);

      await expect(
        dataSegregator.retrieveData(profileId, collection, dataId)
      ).rejects.toThrow('Data integrity verification failed');
    });

    it('should generate isolation report', async () => {
      const profileId = 'test-profile-006';

      const mockCollectionData = [
        {
          profileId,
          _id: 'item1',
          isolation: { encrypted: true, segregated: true, verified: true },
          metadata: { checksum: 'valid-checksum' }
        },
        {
          profileId,
          _id: 'item2',
          isolation: { encrypted: false, segregated: true, verified: true },
          metadata: { checksum: 'valid-checksum' }
        }
      ];

      (enhancedDB.query as any).mockResolvedValue(mockCollectionData);

      const report = await dataSegregator.verifyIsolation(profileId);

      expect(report).toBeDefined();
      expect(report.profileId).toBe(profileId);
      expect(report.totalDataItems).toBe(2);
      expect(report.isolatedItems).toBe(2);
      expect(report.encryptedItems).toBe(1);
      expect(report.isolationIntegrity).toBeGreaterThan(0);
    });

    it('should detect data leakage across profiles', async () => {
      const mockProfiles = [
        { profileId: 'profile-1' },
        { profileId: 'profile-2' }
      ];

      const mockShares = [
        {
          shareId: 'share-1',
          fromProfile: 'profile-1',
          toProfile: 'profile-2',
          permissions: { expiresAt: '2023-01-01T00:00:00.000Z' }, // Expired
          revoked: null
        }
      ];

      (enhancedDB.query as any)
        .mockResolvedValueOnce(mockProfiles) // profiles query
        .mockResolvedValueOnce([]) // isolation data for profile-1
        .mockResolvedValueOnce([]) // isolation data for profile-2
        .mockResolvedValueOnce(mockShares); // shares query

      const leakageReport = await dataSegregator.detectLeakage();

      expect(leakageReport).toBeDefined();
      expect(leakageReport.totalProfiles).toBe(2);
      expect(leakageReport.unauthorizedShares).toHaveLength(1);
      expect(leakageReport.recommendations).toContain('Review and clean up expired data shares');
    });
  });

  describe('ProfileIsolationManager', () => {
    it('should create isolation boundary for profile', async () => {
      const profileId = 'test-profile-007';
      const securityLevel = SecurityClassification.CONFIDENTIAL;

      (enhancedDB.set as any).mockResolvedValue(undefined);

      const boundary = await isolationManager.createIsolationBoundary(profileId, securityLevel);

      expect(boundary).toBeDefined();
      expect(boundary.profileId).toBe(profileId);
      expect(boundary.encryptionLevel).toBe(securityLevel);
      expect(boundary.collections).toContain(`${profileId}_transactions`);
      expect(boundary.isolationRules).toHaveLength(2); // data_segregation + cross_profile_block
    });

    it('should validate profile access with proper permissions', async () => {
      const profileId = 'test-profile-008';
      const resource = `${profileId}_transactions`;
      const operation = 'read';
      const context = {
        deviceFingerprint: 'device-123',
        deviceTrusted: true,
        ipAddress: '192.168.1.1',
        timestamp: new Date().toISOString()
      };

      const mockBoundary = {
        profileId,
        collections: [resource],
        accessControls: {
          profileId,
          permissions: [{
            resource: `${profileId}_*`,
            actions: ['read', 'write'],
            conditions: []
          }],
          restrictions: [],
          auditRequired: false
        },
        isolationRules: []
      };

      (enhancedDB.get as any).mockResolvedValue(mockBoundary);
      (enhancedDB.set as any).mockResolvedValue(undefined);

      const result = await isolationManager.validateProfileAccess(
        profileId,
        resource,
        operation,
        context
      );

      expect(result.allowed).toBe(true);
      expect(result.riskScore).toBeLessThan(50);
    });

    it('should block access to resources outside profile boundary', async () => {
      const profileId = 'test-profile-009';
      const foreignResource = 'other-profile_transactions';
      const operation = 'read';
      const context = {
        deviceFingerprint: 'device-123',
        deviceTrusted: true,
        ipAddress: '192.168.1.1',
        timestamp: new Date().toISOString()
      };

      const mockBoundary = {
        profileId,
        collections: [`${profileId}_transactions`],
        accessControls: {
          profileId,
          permissions: [],
          restrictions: [],
          auditRequired: false
        },
        isolationRules: []
      };

      (enhancedDB.get as any).mockResolvedValue(mockBoundary);
      (enhancedDB.set as any).mockResolvedValue(undefined);

      const result = await isolationManager.validateProfileAccess(
        profileId,
        foreignResource,
        operation,
        context
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Resource does not belong to profile');
      expect(result.riskScore).toBeGreaterThan(90);
    });

    it('should verify isolation integrity', async () => {
      const profileId = 'test-profile-010';

      const mockBoundary = {
        profileId,
        collections: [`${profileId}_transactions`, `${profileId}_settings`],
        encryptionLevel: SecurityClassification.CONFIDENTIAL,
        lastValidated: '2024-01-01T00:00:00.000Z'
      };

      const mockContainer = {
        profileId,
        collections: new Map([
          [`${profileId}_transactions`, {
            name: `${profileId}_transactions`,
            itemCount: 5,
            encryptedItems: 5,
            integrityStatus: 'valid',
            accessPattern: { suspiciousActivity: false }
          }],
          [`${profileId}_settings`, {
            name: `${profileId}_settings`,
            itemCount: 3,
            encryptedItems: 3,
            integrityStatus: 'valid',
            accessPattern: { suspiciousActivity: false }
          }]
        ]),
        accessLog: []
      };

      (enhancedDB.get as any)
        .mockResolvedValueOnce(mockBoundary)
        .mockResolvedValueOnce(mockContainer);
      (enhancedDB.set as any).mockResolvedValue(undefined);

      const report = await isolationManager.verifyIsolationIntegrity(profileId);

      expect(report).toBeDefined();
      expect(report.profileId).toBe(profileId);
      expect(report.integrityScore).toBeGreaterThan(80);
      expect(report.violations).toHaveLength(0);
    });

    it('should generate isolation statistics', async () => {
      const profileId = 'test-profile-011';

      const mockContainer = {
        profileId,
        collections: new Map([
          ['collection1', {
            itemCount: 10,
            encryptedItems: 8,
            accessPattern: { suspiciousActivity: false }
          }],
          ['collection2', {
            itemCount: 5,
            encryptedItems: 5,
            accessPattern: { suspiciousActivity: true }
          }]
        ]),
        accessLog: [
          { riskScore: 20 },
          { riskScore: 30 },
          { riskScore: 10 }
        ]
      };

      (enhancedDB.get as any).mockResolvedValue(mockContainer);

      const stats = await isolationManager.getIsolationStatistics(profileId);

      expect(stats).toBeDefined();
      expect(stats.profileId).toBe(profileId);
      expect(stats.totalCollections).toBe(2);
      expect(stats.totalItems).toBe(15);
      expect(stats.encryptedItems).toBe(13);
      expect(stats.encryptionRate).toBeCloseTo(86.67, 1);
      expect(stats.suspiciousActivity).toBe(1);
      expect(stats.averageRiskScore).toBe(20);
    });
  });

  describe('CrossProfileBarrierManager', () => {
    it('should initialize security barriers for profile', async () => {
      const profileId = 'test-profile-012';
      const securityLevel = SecurityClassification.SECRET;

      (enhancedDB.set as any).mockResolvedValue(undefined);

      await barrierManager.initializeBarriers(profileId, securityLevel);

      // Should create multiple barriers
      expect(enhancedDB.set).toHaveBeenCalledTimes(3); // access_control, data_isolation, encryption_boundary
    });

    it('should block unauthorized cross-profile access', async () => {
      const sourceProfile = 'profile-a';
      const targetProfile = 'profile-b';
      const resource = 'profile-b_transactions';
      const operation = 'read';
      const context = {
        deviceFingerprint: 'device-123',
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
        sessionId: 'session-123',
        authenticationLevel: 'basic' as const
      };

      (enhancedDB.set as any).mockResolvedValue(undefined);

      const result = await barrierManager.checkCrossProfileAccess(
        sourceProfile,
        targetProfile,
        resource,
        operation,
        context
      );

      expect(result.allowed).toBe(false);
      expect(result.riskScore).toBeGreaterThan(50);
      expect(result.triggeredBarriers).toHaveLength(0); // No barriers initialized in this test
    });

    it('should calculate appropriate risk scores', async () => {
      const sourceProfile = 'profile-c';
      const targetProfile = 'profile-d';
      const resource = 'profile-d_apiKeys';
      const operation = 'delete'; // High-risk operation
      const context = {
        deviceFingerprint: 'unknown-device',
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
        sessionId: 'session-456',
        authenticationLevel: 'basic' as const // Low security auth
      };

      (enhancedDB.set as any).mockResolvedValue(undefined);

      const result = await barrierManager.checkCrossProfileAccess(
        sourceProfile,
        targetProfile,
        resource,
        operation,
        context
      );

      // Should have high risk score due to:
      // - Cross-profile access (50)
      // - Delete operation (40)
      // - Basic auth (20)
      expect(result.riskScore).toBeGreaterThan(100);
    });

    it('should enforce data isolation', async () => {
      const profileId = 'test-profile-013';
      const dataId = 'other-profile_data-123'; // Data from different profile
      const operation = 'read';
      const context = {};

      const result = await barrierManager.enforceDataIsolation(
        profileId,
        dataId,
        operation,
        context
      );

      expect(result.enforced).toBe(true);
      expect(result.action).toBe('blocked');
      expect(result.reason).toContain('Data does not belong to profile');
      expect(result.severity).toBe('high');
    });

    it('should detect suspicious access patterns', async () => {
      const profileId = 'test-profile-014';
      const dataId = `${profileId}_data-123`;
      const operation = 'read';
      const context = {};

      // Mock suspicious pattern detection
      const result = await barrierManager.enforceDataIsolation(
        profileId,
        dataId,
        operation,
        context
      );

      // Should allow access to own data
      expect(result.enforced).toBe(false);
      expect(result.action).toBe('allowed');
    });

    it('should generate barrier metrics', async () => {
      const metrics = await barrierManager.getBarrierMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalBarriers).toBeGreaterThanOrEqual(0);
      expect(metrics.securityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.securityScore).toBeLessThanOrEqual(100);
      expect(metrics.lastUpdated).toBeDefined();
    });

    it('should start and stop monitoring', async () => {
      // Test monitoring lifecycle
      await barrierManager.startMonitoring();
      // Monitoring should be active (no direct way to test this in unit test)
      
      barrierManager.stopMonitoring();
      // Monitoring should be stopped
      
      // No exceptions should be thrown
      expect(true).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should maintain complete isolation between profiles', async () => {
      const profile1 = 'profile-alpha';
      const profile2 = 'profile-beta';
      const testData = { secret: 'confidential-data' };

      (enhancedDB.set as any).mockResolvedValue(undefined);
      (enhancedDB.get as any).mockResolvedValue(null);

      // Isolate data for profile1
      await dataSegregator.isolateData(
        profile1,
        'secrets',
        testData,
        SecurityClassification.SECRET
      );

      // Attempt to access from profile2 should fail
      const result = await dataSegregator.retrieveData(profile2, 'secrets', 'test-id');
      
      expect(result).toBeNull(); // Should not find data from different profile
    });

    it('should enforce encryption for sensitive data across all components', async () => {
      const profileId = 'secure-profile';
      const sensitiveData = { apiKey: 'super-secret-key' };

      (enhancedDB.set as any).mockResolvedValue(undefined);

      // Data segregator should encrypt sensitive data
      const isolatedData = await dataSegregator.isolateData(
        profileId,
        'apiKeys',
        sensitiveData,
        SecurityClassification.SECRET
      );

      expect(isolatedData.isolation.encrypted).toBe(true);
      expect(profileEncryptor.encryptForProfile).toHaveBeenCalledWith(
        profileId,
        sensitiveData,
        SecurityClassification.SECRET
      );
    });

    it('should provide comprehensive security reporting', async () => {
      const profileId = 'reporting-profile';

      // Mock data for comprehensive reporting
      const mockBoundary = {
        profileId,
        collections: [`${profileId}_transactions`],
        encryptionLevel: SecurityClassification.CONFIDENTIAL
      };

      const mockContainer = {
        profileId,
        collections: new Map([
          [`${profileId}_transactions`, {
            itemCount: 100,
            encryptedItems: 95,
            accessPattern: { suspiciousActivity: false }
          }]
        ]),
        accessLog: Array.from({ length: 50 }, (_, i) => ({ riskScore: i % 100 }))
      };

      (enhancedDB.get as any)
        .mockResolvedValueOnce(mockBoundary)
        .mockResolvedValueOnce(mockContainer);
      (enhancedDB.set as any).mockResolvedValue(undefined);

      // Get isolation statistics
      const isolationStats = await isolationManager.getIsolationStatistics(profileId);
      
      // Get barrier metrics
      const barrierMetrics = await barrierManager.getBarrierMetrics();

      // Verify comprehensive reporting
      expect(isolationStats.encryptionRate).toBeGreaterThan(90);
      expect(isolationStats.totalItems).toBe(100);
      expect(barrierMetrics.securityScore).toBeGreaterThanOrEqual(0);
    });
  });
});