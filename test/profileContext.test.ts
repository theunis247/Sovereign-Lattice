/**
 * Profile Context Manager Unit Tests
 * Tests for profile context management and session handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProfileContextManager, ProfileSession, ProfileSwitchResult } from '../services/profileContext';
import { ProfileManager, ProfileContext, SecurityClassification } from '../services/profileManager';
import { enhancedDB } from '../services/enhancedDatabase';

// Mock dependencies
vi.mock('../services/enhancedDatabase', () => ({
  enhancedDB: {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    query: vi.fn()
  }
}));

vi.mock('../services/profileManager');

describe('ProfileContextManager', () => {
  let contextManager: ProfileContextManager;
  let mockProfileManager: ProfileManager;
  let mockProfile: ProfileContext;

  beforeEach(() => {
    mockProfileManager = new ProfileManager();
    contextManager = new ProfileContextManager(mockProfileManager);
    
    mockProfile = {
      profileId: 'test-profile',
      username: 'testuser',
      displayName: 'Test User',
      securityLevel: SecurityClassification.INTERNAL,
      encryptionConfig: {
        algorithm: 'AES-GCM',
        keyLength: 256,
        rotationInterval: 90,
        backupEncryption: true
      },
      keyRotationSchedule: {
        enabled: true,
        intervalDays: 90,
        lastRotation: '2024-01-01T00:00:00.000Z',
        nextRotation: '2024-04-01T00:00:00.000Z'
      },
      collections: {
        transactions: 'test-profile_transactions',
        breakthroughs: 'test-profile_breakthroughs',
        apiKeys: 'test-profile_apiKeys',
        settings: 'test-profile_settings',
        blocks: 'test-profile_blocks',
        research: 'test-profile_research'
      },
      dataSegregation: {
        isolationLevel: SecurityClassification.INTERNAL,
        crossProfileSharing: false,
        dataLeakagePrevention: true
      },
      syncConfig: {
        enabled: true,
        realtimeSync: true,
        conflictResolution: 'security_first',
        encryptionRequired: true
      },
      syncStatus: 'synced' as any,
      auditConfig: {
        enabled: true,
        retentionDays: 365,
        realTimeMonitoring: true,
        alertThresholds: {
          failedLogins: 3,
          suspiciousActivity: 5,
          dataModifications: 100
        }
      },
      complianceLevel: 'standard' as any,
      created: '2024-01-01T00:00:00.000Z',
      lastAccessed: '2024-01-01T00:00:00.000Z',
      lastModified: '2024-01-01T00:00:00.000Z',
      version: 1,
      isLocked: false
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    contextManager.destroy();
    vi.restoreAllMocks();
  });

  describe('initializeContext', () => {
    it('should initialize context for valid profile', async () => {
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);

      const result = await contextManager.initializeContext('test-profile');

      expect(result).toBeDefined();
      expect(result.profileId).toBe('test-profile');
      expect(contextManager.getActiveProfile()).toBe(mockProfile);
      expect(contextManager.getActiveSession()).toBeDefined();
    });

    it('should throw error if profile not active in manager', async () => {
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(null);

      await expect(contextManager.initializeContext('test-profile')).rejects.toThrow(
        'Profile not active in manager'
      );
    });

    it('should throw error if profile ID mismatch', async () => {
      const differentProfile = { ...mockProfile, profileId: 'different-profile' };
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(differentProfile);

      await expect(contextManager.initializeContext('test-profile')).rejects.toThrow(
        'Profile not active in manager'
      );
    });
  });

  describe('switchProfileContext', () => {
    const mockCredentials = { password: 'test-password' };

    it('should switch profile context successfully', async () => {
      // Setup initial profile
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);
      await contextManager.initializeContext('test-profile');

      // Setup new profile
      const newProfile = { ...mockProfile, profileId: 'new-profile', username: 'newuser' };
      (mockProfileManager.switchProfile as any) = vi.fn().mockResolvedValue(newProfile);
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(newProfile);

      const result = await contextManager.switchProfileContext('new-profile', mockCredentials);

      expect(result.success).toBe(true);
      expect(result.previousProfile).toBe('test-profile');
      expect(result.newProfile).toBe('new-profile');
      expect(result.sessionId).toBeDefined();
      expect(contextManager.getActiveProfile()?.profileId).toBe('new-profile');
    });

    it('should handle switch failure and restore previous context', async () => {
      // Setup initial profile
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);
      await contextManager.initializeContext('test-profile');

      // Mock switch failure
      (mockProfileManager.switchProfile as any) = vi.fn().mockRejectedValue(new Error('Switch failed'));

      const result = await contextManager.switchProfileContext('new-profile', mockCredentials);

      expect(result.success).toBe(false);
      expect(result.warnings).toContain('Switch failed');
    });

    it('should detect rapid profile switching', async () => {
      // Setup initial profile
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);
      await contextManager.initializeContext('test-profile');

      // Immediately switch to another profile
      const newProfile = { ...mockProfile, profileId: 'new-profile' };
      (mockProfileManager.switchProfile as any) = vi.fn().mockResolvedValue(newProfile);
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(newProfile);

      const result = await contextManager.switchProfileContext('new-profile', mockCredentials);

      expect(result.warnings).toContain('Rapid profile switching detected');
    });
  });

  describe('validateContextSecurity', () => {
    beforeEach(async () => {
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);
      await contextManager.initializeContext('test-profile');
    });

    it('should validate active context successfully', async () => {
      const result = await contextManager.validateContextSecurity();
      expect(result).toBe(true);
    });

    it('should fail validation if no active profile', async () => {
      await contextManager.invalidateContext('Test invalidation');
      
      const result = await contextManager.validateContextSecurity();
      expect(result).toBe(false);
    });

    it('should fail validation if session expired', async () => {
      // Mock expired session
      const expiredSession = contextManager.getActiveSession();
      if (expiredSession) {
        expiredSession.lastActivity = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      }

      const result = await contextManager.validateContextSecurity();
      expect(result).toBe(false);
    });
  });

  describe('session management', () => {
    beforeEach(async () => {
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);
      await contextManager.initializeContext('test-profile');
    });

    it('should create valid session on initialization', () => {
      const session = contextManager.getActiveSession();
      
      expect(session).toBeDefined();
      expect(session?.profileId).toBe('test-profile');
      expect(session?.isActive).toBe(true);
      expect(session?.securityLevel).toBe(SecurityClassification.INTERNAL);
      expect(session?.sessionId).toBeDefined();
    });

    it('should update activity timestamp', async () => {
      const session = contextManager.getActiveSession();
      const originalActivity = session?.lastActivity;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await contextManager.updateActivity();
      
      const updatedSession = contextManager.getActiveSession();
      expect(updatedSession?.lastActivity).not.toBe(originalActivity);
    });

    it('should track profile history', () => {
      const history = contextManager.getProfileHistory();
      
      expect(history).toHaveLength(1);
      expect(history[0].profileId).toBe('test-profile');
      expect(history[0].username).toBe('testuser');
      expect(history[0].activityCount).toBe(1);
    });
  });

  describe('permissions', () => {
    beforeEach(async () => {
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);
      await contextManager.initializeContext('test-profile');
    });

    it('should have correct permissions for standard security level', () => {
      expect(contextManager.hasPermission('canRead')).toBe(true);
      expect(contextManager.hasPermission('canWrite')).toBe(true);
      expect(contextManager.hasPermission('canDelete')).toBe(true);
      expect(contextManager.hasPermission('canExport')).toBe(true);
      expect(contextManager.hasPermission('canShare')).toBe(false); // Disabled by default
      expect(contextManager.hasPermission('canAdmin')).toBe(false);
    });

    it('should have restricted permissions for high security level', async () => {
      const highSecurityProfile = {
        ...mockProfile,
        securityLevel: SecurityClassification.SECRET
      };
      
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(highSecurityProfile);
      await contextManager.initializeContext('test-profile');

      expect(contextManager.hasPermission('canRead')).toBe(true);
      expect(contextManager.hasPermission('canWrite')).toBe(true);
      expect(contextManager.hasPermission('canDelete')).toBe(false); // Restricted for high security
      expect(contextManager.hasPermission('canExport')).toBe(false); // Restricted for high security
      expect(contextManager.hasPermission('canAdmin')).toBe(true); // Admin allowed for SECRET level
    });
  });

  describe('encryption key management', () => {
    beforeEach(async () => {
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);
      await contextManager.initializeContext('test-profile');
    });

    it('should initialize encryption keys', () => {
      const dataKey = contextManager.getEncryptionKey('data');
      const syncKey = contextManager.getEncryptionKey('sync');
      
      expect(dataKey).toBeDefined();
      expect(syncKey).toBeDefined();
    });

    it('should allow setting custom encryption keys', async () => {
      const customKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      contextManager.setEncryptionKey('custom', customKey);
      
      const retrievedKey = contextManager.getEncryptionKey('custom');
      expect(retrievedKey).toBe(customKey);
    });

    it('should return null for non-existent keys', () => {
      const nonExistentKey = contextManager.getEncryptionKey('non-existent');
      expect(nonExistentKey).toBeNull();
    });
  });

  describe('security context', () => {
    beforeEach(async () => {
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);
      await contextManager.initializeContext('test-profile');
    });

    it('should initialize security context correctly', () => {
      const securityContext = contextManager.getSecurityContext();
      
      expect(securityContext.securityLevel).toBe(SecurityClassification.INTERNAL);
      expect(securityContext.threatLevel).toBe('medium');
      expect(securityContext.encryptionKeys.size).toBeGreaterThan(0);
      expect(securityContext.lastSecurityCheck).toBeDefined();
    });

    it('should update threat level for high security profiles', async () => {
      const highSecurityProfile = {
        ...mockProfile,
        securityLevel: SecurityClassification.SECRET
      };
      
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(highSecurityProfile);
      await contextManager.initializeContext('test-profile');

      const securityContext = contextManager.getSecurityContext();
      expect(securityContext.threatLevel).toBe('low'); // Lower threat for higher security
    });
  });

  describe('invalidateContext', () => {
    beforeEach(async () => {
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);
      await contextManager.initializeContext('test-profile');
    });

    it('should clear all context data', async () => {
      await contextManager.invalidateContext('Test invalidation');
      
      expect(contextManager.getActiveProfile()).toBeNull();
      expect(contextManager.getActiveSession()).toBeNull();
      
      const securityContext = contextManager.getSecurityContext();
      expect(securityContext.encryptionKeys.size).toBe(0);
      expect(securityContext.accessTokens.size).toBe(0);
      expect(securityContext.threatLevel).toBe('medium');
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors gracefully', async () => {
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockImplementation(() => {
        throw new Error('Manager error');
      });

      await expect(contextManager.initializeContext('test-profile')).rejects.toThrow(
        'Context initialization failed'
      );
    });

    it('should handle database errors during session save', async () => {
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(mockProfile);
      (enhancedDB.set as any).mockRejectedValue(new Error('Database error'));

      // Should not throw, but log error
      await expect(contextManager.initializeContext('test-profile')).resolves.toBeDefined();
    });
  });

  describe('cleanup and destruction', () => {
    it('should cleanup resources on destroy', async () => {
      (mockProfileManager.getCurrentProfile as any) = vi.fn().mockReturnValue(mockProfile);
      (enhancedDB.set as any).mockResolvedValue(undefined);
      await contextManager.initializeContext('test-profile');

      contextManager.destroy();

      expect(contextManager.getActiveProfile()).toBeNull();
      expect(contextManager.getActiveSession()).toBeNull();
    });
  });
});