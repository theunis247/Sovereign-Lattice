/**
 * Profile Manager Unit Tests
 * Comprehensive tests for profile management functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProfileManager, ProfileConfig, SecurityClassification, ProfileSyncStatus } from '../services/profileManager';
import { profileAuth } from '../services/profileAuth';
import { enhancedDB } from '../services/enhancedDatabase';

// Mock the enhanced database
vi.mock('../services/enhancedDatabase', () => ({
  enhancedDB: {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    query: vi.fn(),
    initialize: vi.fn()
  }
}));

// Mock the encryption service
vi.mock('../services/encryption', () => ({
  EncryptionService: {
    encrypt: vi.fn().mockResolvedValue({ encryptedData: 'encrypted', iv: 'iv', salt: 'salt' }),
    decrypt: vi.fn().mockResolvedValue('decrypted'),
    hash: vi.fn().mockResolvedValue('hashed'),
    generateSecurePassword: vi.fn().mockReturnValue('secure-password-123')
  }
}));

describe('ProfileManager', () => {
  let profileManager: ProfileManager;
  let mockConfig: ProfileConfig;

  beforeEach(() => {
    profileManager = new ProfileManager();
    mockConfig = {
      profileId: 'test-profile-123',
      username: 'testuser',
      encryptionSeed: 'test-encryption-seed-12345',
      securityLevel: 'standard',
      syncEnabled: true,
      backupEnabled: true,
      auditEnabled: true
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createProfile', () => {
    it('should create a new profile with valid configuration', async () => {
      // Mock database responses
      (enhancedDB.get as any).mockResolvedValue(null); // Profile doesn't exist
      (enhancedDB.set as any).mockResolvedValue(undefined);

      const result = await profileManager.createProfile(mockConfig);

      expect(result).toBeDefined();
      expect(result.profileId).toBe(mockConfig.profileId);
      expect(result.username).toBe(mockConfig.username);
      expect(result.securityLevel).toBe(SecurityClassification.INTERNAL);
      expect(result.syncStatus).toBe(ProfileSyncStatus.PENDING);
      expect(result.isLocked).toBe(false);

      // Verify database calls
      expect(enhancedDB.get).toHaveBeenCalledWith('profiles', mockConfig.profileId);
      expect(enhancedDB.set).toHaveBeenCalledWith('profiles', mockConfig.profileId, expect.any(Object));
    });

    it('should throw error if profile already exists', async () => {
      // Mock existing profile
      (enhancedDB.get as any).mockResolvedValue({ profileId: mockConfig.profileId });

      await expect(profileManager.createProfile(mockConfig)).rejects.toThrow(
        'Profile test-profile-123 already exists'
      );
    });

    it('should validate profile configuration', async () => {
      const invalidConfig = {
        ...mockConfig,
        profileId: 'ab', // Too short
        username: 'a', // Too short
        encryptionSeed: 'short' // Too short
      };

      await expect(profileManager.createProfile(invalidConfig)).rejects.toThrow();
    });

    it('should create profile with military security level', async () => {
      const militaryConfig = {
        ...mockConfig,
        securityLevel: 'military' as const
      };

      (enhancedDB.get as any).mockResolvedValue(null);
      (enhancedDB.set as any).mockResolvedValue(undefined);

      const result = await profileManager.createProfile(militaryConfig);

      expect(result.securityLevel).toBe(SecurityClassification.SECRET);
      expect(result.keyRotationSchedule.intervalDays).toBe(30); // Military has shorter rotation
    });
  });

  describe('switchProfile', () => {
    const mockCredentials = {
      password: 'test-password-123',
      mfaToken: '123456'
    };

    it('should switch to existing unlocked profile', async () => {
      const mockProfile = {
        profileId: mockConfig.profileId,
        username: mockConfig.username,
        displayName: mockConfig.username,
        securityLevel: SecurityClassification.INTERNAL,
        isLocked: false,
        lastAccessed: '2024-01-01T00:00:00.000Z',
        created: '2024-01-01T00:00:00.000Z',
        lastModified: '2024-01-01T00:00:00.000Z',
        version: 1
      };

      (enhancedDB.get as any).mockResolvedValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);

      const result = await profileManager.switchProfile(mockConfig.profileId, mockCredentials);

      expect(result).toBeDefined();
      expect(result.profileId).toBe(mockConfig.profileId);
      expect(result.lastAccessed).not.toBe(mockProfile.lastAccessed); // Should be updated

      // Verify database update
      expect(enhancedDB.set).toHaveBeenCalledWith('profiles', mockConfig.profileId, expect.any(Object));
    });

    it('should throw error for non-existent profile', async () => {
      (enhancedDB.get as any).mockResolvedValue(null);

      await expect(
        profileManager.switchProfile('non-existent', mockCredentials)
      ).rejects.toThrow('Profile non-existent not found');
    });

    it('should throw error for locked profile', async () => {
      const lockedProfile = {
        profileId: mockConfig.profileId,
        isLocked: true
      };

      (enhancedDB.get as any).mockResolvedValue(lockedProfile);

      await expect(
        profileManager.switchProfile(mockConfig.profileId, mockCredentials)
      ).rejects.toThrow('Profile test-profile-123 is locked');
    });
  });

  describe('deleteProfile', () => {
    it('should delete profile with correct confirmation', async () => {
      const mockProfile = {
        profileId: mockConfig.profileId,
        collections: {
          transactions: 'test-profile-123_transactions',
          breakthroughs: 'test-profile-123_breakthroughs',
          apiKeys: 'test-profile-123_apiKeys',
          settings: 'test-profile-123_settings',
          blocks: 'test-profile-123_blocks',
          research: 'test-profile-123_research'
        }
      };

      (enhancedDB.get as any).mockResolvedValue(mockProfile);
      (enhancedDB.query as any).mockResolvedValue([]);
      (enhancedDB.delete as any).mockResolvedValue(undefined);
      (enhancedDB.set as any).mockResolvedValue(undefined);

      await expect(
        profileManager.deleteProfile(mockConfig.profileId, mockConfig.profileId)
      ).resolves.not.toThrow();

      // Verify profile deletion
      expect(enhancedDB.delete).toHaveBeenCalledWith('profiles', mockConfig.profileId);
    });

    it('should throw error with incorrect confirmation', async () => {
      await expect(
        profileManager.deleteProfile(mockConfig.profileId, 'wrong-confirmation')
      ).rejects.toThrow('Confirmation does not match profile ID');
    });

    it('should throw error for non-existent profile', async () => {
      (enhancedDB.get as any).mockResolvedValue(null);

      await expect(
        profileManager.deleteProfile('non-existent', 'non-existent')
      ).rejects.toThrow('Profile non-existent not found');
    });
  });

  describe('listProfiles', () => {
    it('should return list of profile summaries', async () => {
      const mockProfiles = [
        {
          profileId: 'profile1',
          username: 'user1',
          displayName: 'User One',
          securityLevel: SecurityClassification.INTERNAL,
          lastAccessed: '2024-01-01T00:00:00.000Z',
          isLocked: false,
          syncStatus: ProfileSyncStatus.SYNCED
        },
        {
          profileId: 'profile2',
          username: 'user2',
          displayName: 'User Two',
          securityLevel: SecurityClassification.CONFIDENTIAL,
          lastAccessed: '2024-01-02T00:00:00.000Z',
          isLocked: true,
          syncStatus: ProfileSyncStatus.PENDING
        }
      ];

      (enhancedDB.query as any).mockResolvedValue(mockProfiles);

      const result = await profileManager.listProfiles();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        profileId: 'profile1',
        username: 'user1',
        displayName: 'User One',
        securityLevel: SecurityClassification.INTERNAL,
        lastAccessed: '2024-01-01T00:00:00.000Z',
        isLocked: false,
        syncStatus: ProfileSyncStatus.SYNCED
      });
    });

    it('should return empty array on database error', async () => {
      (enhancedDB.query as any).mockRejectedValue(new Error('Database error'));

      const result = await profileManager.listProfiles();

      expect(result).toEqual([]);
    });
  });

  describe('exportProfile', () => {
    it('should export profile data with encryption', async () => {
      const mockProfile = {
        profileId: mockConfig.profileId,
        version: 1,
        collections: {
          transactions: 'test_transactions',
          breakthroughs: 'test_breakthroughs'
        }
      };

      (enhancedDB.get as any).mockResolvedValue(mockProfile);
      (enhancedDB.query as any).mockResolvedValue([]);
      (enhancedDB.set as any).mockResolvedValue(undefined);

      const result = await profileManager.exportProfile(mockConfig.profileId, 'export-password');

      expect(result).toBeDefined();
      expect(result.profileId).toBe(mockConfig.profileId);
      expect(result.encryptedData).toBeDefined();
      expect(result.metadata.version).toBe(1);
      expect(result.metadata.checksum).toBeDefined();
    });

    it('should throw error for non-existent profile', async () => {
      (enhancedDB.get as any).mockResolvedValue(null);

      await expect(
        profileManager.exportProfile('non-existent', 'password')
      ).rejects.toThrow('Profile non-existent not found');
    });
  });

  describe('lockProfile', () => {
    it('should lock an existing profile', async () => {
      const mockProfile = {
        profileId: mockConfig.profileId,
        isLocked: false,
        lastModified: '2024-01-01T00:00:00.000Z'
      };

      (enhancedDB.get as any).mockResolvedValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);

      await expect(profileManager.lockProfile(mockConfig.profileId)).resolves.not.toThrow();

      // Verify profile was updated with locked status
      expect(enhancedDB.set).toHaveBeenCalledWith(
        'profiles',
        mockConfig.profileId,
        expect.objectContaining({ isLocked: true })
      );
    });

    it('should throw error for non-existent profile', async () => {
      (enhancedDB.get as any).mockResolvedValue(null);

      await expect(profileManager.lockProfile('non-existent')).rejects.toThrow(
        'Profile non-existent not found'
      );
    });
  });

  describe('unlockProfile', () => {
    const mockCredentials = {
      password: 'test-password-123'
    };

    it('should unlock a locked profile with valid credentials', async () => {
      const mockProfile = {
        profileId: mockConfig.profileId,
        isLocked: true,
        lastModified: '2024-01-01T00:00:00.000Z'
      };

      (enhancedDB.get as any).mockResolvedValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);

      await expect(
        profileManager.unlockProfile(mockConfig.profileId, mockCredentials)
      ).resolves.not.toThrow();

      // Verify profile was updated with unlocked status
      expect(enhancedDB.set).toHaveBeenCalledWith(
        'profiles',
        mockConfig.profileId,
        expect.objectContaining({ isLocked: false })
      );
    });

    it('should throw error for non-existent profile', async () => {
      (enhancedDB.get as any).mockResolvedValue(null);

      await expect(
        profileManager.unlockProfile('non-existent', mockCredentials)
      ).rejects.toThrow('Profile non-existent not found');
    });
  });

  describe('rotateProfileKeys', () => {
    it('should rotate encryption keys for existing profile', async () => {
      const mockProfile = {
        profileId: mockConfig.profileId,
        username: mockConfig.username,
        securityLevel: SecurityClassification.INTERNAL,
        syncConfig: { enabled: true },
        auditConfig: { enabled: true },
        keyRotationSchedule: {
          intervalDays: 90,
          lastRotation: '2024-01-01T00:00:00.000Z'
        },
        version: 1
      };

      (enhancedDB.get as any).mockResolvedValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);

      await expect(profileManager.rotateProfileKeys(mockConfig.profileId)).resolves.not.toThrow();

      // Verify profile was updated with new rotation schedule and version
      expect(enhancedDB.set).toHaveBeenCalledWith(
        'profiles',
        mockConfig.profileId,
        expect.objectContaining({
          version: 2,
          keyRotationSchedule: expect.objectContaining({
            lastRotation: expect.any(String)
          })
        })
      );
    });

    it('should throw error for non-existent profile', async () => {
      (enhancedDB.get as any).mockResolvedValue(null);

      await expect(profileManager.rotateProfileKeys('non-existent')).rejects.toThrow(
        'Profile non-existent not found'
      );
    });
  });

  describe('auditProfile', () => {
    it('should generate audit report for existing profile', async () => {
      const mockProfile = {
        profileId: mockConfig.profileId,
        created: '2024-01-01T00:00:00.000Z'
      };

      const mockAuditEvents = [
        {
          eventId: 'event1',
          timestamp: '2024-01-01T12:00:00.000Z',
          eventType: 'access',
          description: 'Profile created',
          severity: 'medium',
          metadata: {}
        }
      ];

      (enhancedDB.get as any).mockResolvedValue(mockProfile);
      (enhancedDB.query as any).mockResolvedValue(mockAuditEvents.map(event => ({
        profileId: mockConfig.profileId,
        ...event
      })));

      const result = await profileManager.auditProfile(mockConfig.profileId);

      expect(result).toBeDefined();
      expect(result.profileId).toBe(mockConfig.profileId);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].eventType).toBe('access');
      expect(result.securityMetrics).toBeDefined();
      expect(result.complianceStatus).toBeDefined();
    });

    it('should throw error for non-existent profile', async () => {
      (enhancedDB.get as any).mockResolvedValue(null);

      await expect(profileManager.auditProfile('non-existent')).rejects.toThrow(
        'Profile non-existent not found'
      );
    });
  });

  describe('getCurrentProfile', () => {
    it('should return null when no profile is active', () => {
      const result = profileManager.getCurrentProfile();
      expect(result).toBeNull();
    });

    it('should return current profile after switching', async () => {
      const mockProfile = {
        profileId: mockConfig.profileId,
        username: mockConfig.username,
        isLocked: false,
        lastAccessed: '2024-01-01T00:00:00.000Z'
      };

      (enhancedDB.get as any).mockResolvedValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);

      await profileManager.switchProfile(mockConfig.profileId, { password: 'test' });
      
      const result = profileManager.getCurrentProfile();
      expect(result).toBeDefined();
      expect(result?.profileId).toBe(mockConfig.profileId);
    });
  });

  describe('Security Level Mapping', () => {
    it('should map security levels correctly', async () => {
      const testCases = [
        { input: 'standard', expected: SecurityClassification.INTERNAL },
        { input: 'high', expected: SecurityClassification.CONFIDENTIAL },
        { input: 'military', expected: SecurityClassification.SECRET }
      ];

      (enhancedDB.get as any).mockResolvedValue(null);
      (enhancedDB.set as any).mockResolvedValue(undefined);

      for (const testCase of testCases) {
        const config = { ...mockConfig, securityLevel: testCase.input as any };
        const result = await profileManager.createProfile({
          ...config,
          profileId: `test-${testCase.input}`
        });

        expect(result.securityLevel).toBe(testCase.expected);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (enhancedDB.get as any).mockRejectedValue(new Error('Database connection failed'));

      await expect(profileManager.createProfile(mockConfig)).rejects.toThrow(
        'Profile creation failed'
      );
    });

    it('should handle encryption errors gracefully', async () => {
      const { EncryptionService } = await import('../services/encryption');
      (EncryptionService.hash as any).mockRejectedValue(new Error('Encryption failed'));

      (enhancedDB.get as any).mockResolvedValue(null);

      await expect(profileManager.createProfile(mockConfig)).rejects.toThrow();
    });
  });
});