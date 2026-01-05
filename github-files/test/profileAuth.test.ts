/**
 * Profile Authentication Service Unit Tests
 * Tests for authentication, MFA, and security policies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  ProfileAuthenticationService, 
  AuthenticationCredentials, 
  MFAMethod, 
  SecurityClassification 
} from '../services/profileAuth';
import { enhancedDB } from '../services/enhancedDatabase';
import { EncryptionService } from '../services/encryption';

// Mock dependencies
vi.mock('../services/enhancedDatabase', () => ({
  enhancedDB: {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    query: vi.fn()
  }
}));

vi.mock('../services/encryption', () => ({
  EncryptionService: {
    hash: vi.fn(),
    generateSecurePassword: vi.fn().mockReturnValue('secure-password-123')
  }
}));

describe('ProfileAuthenticationService', () => {
  let authService: ProfileAuthenticationService;
  let mockCredentials: AuthenticationCredentials;

  beforeEach(() => {
    authService = new ProfileAuthenticationService();
    mockCredentials = {
      profileId: 'test-profile',
      password: 'test-password-123',
      deviceFingerprint: 'device-123'
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createProfileCredentials', () => {
    it('should create credentials for new profile', async () => {
      (EncryptionService.hash as any).mockResolvedValue('hashed-password');
      (enhancedDB.set as any).mockResolvedValue(undefined);

      await expect(
        authService.createProfileCredentials('test-profile', 'password123', SecurityClassification.INTERNAL)
      ).resolves.not.toThrow();

      expect(enhancedDB.set).toHaveBeenCalledWith(
        'profile_credentials',
        'test-profile',
        expect.objectContaining({
          profileId: 'test-profile',
          passwordHash: 'hashed-password',
          salt: expect.any(String)
        })
      );

      expect(enhancedDB.set).toHaveBeenCalledWith(
        'auth_policies',
        'test-profile',
        expect.objectContaining({
          profileId: 'test-profile',
          passwordPolicy: expect.any(Object),
          mfaPolicy: expect.any(Object)
        })
      );
    });

    it('should create different policies for different security levels', async () => {
      (EncryptionService.hash as any).mockResolvedValue('hashed-password');
      (enhancedDB.set as any).mockResolvedValue(undefined);

      // Test military security level
      await authService.createProfileCredentials('military-profile', 'password123', SecurityClassification.SECRET);

      const militaryPolicyCall = (enhancedDB.set as any).mock.calls.find(
        call => call[0] === 'auth_policies' && call[1] === 'military-profile'
      );

      expect(militaryPolicyCall[2].passwordPolicy.minLength).toBe(12); // Military requires longer passwords
      expect(militaryPolicyCall[2].mfaPolicy.required).toBe(true); // Military requires MFA
      expect(militaryPolicyCall[2].lockoutPolicy.maxAttempts).toBe(3); // Military has stricter lockout
    });
  });

  describe('authenticateProfile', () => {
    const mockStoredCredentials = {
      profileId: 'test-profile',
      passwordHash: 'hashed-password',
      salt: 'test-salt',
      passwordHistory: ['hashed-password'],
      biometricHashes: new Map(),
      trustedDevices: [],
      lastPasswordChange: '2024-01-01T00:00:00.000Z',
      created: '2024-01-01T00:00:00.000Z',
      modified: '2024-01-01T00:00:00.000Z'
    };

    const mockAuthPolicy = {
      profileId: 'test-profile',
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        maxAge: 90,
        historyCount: 5
      },
      mfaPolicy: {
        required: false,
        methods: [MFAMethod.TOTP],
        backupCodes: true,
        timeWindow: 30
      },
      lockoutPolicy: {
        maxAttempts: 5,
        lockoutDuration: 15,
        progressiveLockout: true,
        alertOnLockout: false
      },
      biometricPolicy: {
        enabled: true,
        requiredMethods: [],
        minConfidence: 0.8,
        fallbackToPassword: true
      },
      devicePolicy: {
        trustKnownDevices: true,
        maxTrustedDevices: 5,
        requireDeviceAuth: false,
        deviceSessionTimeout: 120
      }
    };

    beforeEach(() => {
      // Mock no lockout status
      (enhancedDB.get as any).mockImplementation((collection, id) => {
        if (collection === 'profile_lockouts') return Promise.resolve(null);
        if (collection === 'auth_policies') return Promise.resolve(mockAuthPolicy);
        if (collection === 'profile_credentials') return Promise.resolve(mockStoredCredentials);
        return Promise.resolve(null);
      });

      (enhancedDB.set as any).mockResolvedValue(undefined);
      (EncryptionService.hash as any).mockResolvedValue('hashed-password');
    });

    it('should authenticate valid credentials successfully', async () => {
      const result = await authService.authenticateProfile(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.profileId).toBe('test-profile');
      expect(result.sessionToken).toBeDefined();
      expect(result.mfaRequired).toBeUndefined();
    });

    it('should fail authentication for invalid password', async () => {
      (EncryptionService.hash as any).mockResolvedValue('wrong-hash');

      const result = await authService.authenticateProfile(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.failureReason).toBe('Invalid credentials');
    });

    it('should fail authentication for non-existent profile', async () => {
      (enhancedDB.get as any).mockImplementation((collection, id) => {
        if (collection === 'profile_credentials') return Promise.resolve(null);
        return Promise.resolve(null);
      });

      const result = await authService.authenticateProfile(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.failureReason).toBe('Invalid credentials');
    });

    it('should fail authentication for locked profile', async () => {
      const lockoutStatus = {
        profileId: 'test-profile',
        isLocked: true,
        lockoutEnd: new Date(Date.now() + 60000).toISOString(),
        attemptCount: 5
      };

      (enhancedDB.get as any).mockImplementation((collection, id) => {
        if (collection === 'profile_lockouts') return Promise.resolve(lockoutStatus);
        return Promise.resolve(null);
      });

      const result = await authService.authenticateProfile(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.lockoutTime).toBeDefined();
      expect(result.failureReason).toContain('locked');
    });

    it('should require MFA for high security profiles', async () => {
      const highSecurityPolicy = {
        ...mockAuthPolicy,
        mfaPolicy: { ...mockAuthPolicy.mfaPolicy, required: true }
      };

      (enhancedDB.get as any).mockImplementation((collection, id) => {
        if (collection === 'auth_policies') return Promise.resolve(highSecurityPolicy);
        if (collection === 'profile_credentials') return Promise.resolve(mockStoredCredentials);
        return Promise.resolve(null);
      });

      const result = await authService.authenticateProfile(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.mfaRequired).toBe(true);
    });

    it('should verify MFA token when provided', async () => {
      const credentialsWithMFA = {
        ...mockCredentials,
        mfaToken: '123456'
      };

      const credentialsWithSecret = {
        ...mockStoredCredentials,
        mfaSecret: 'test-secret'
      };

      (enhancedDB.get as any).mockImplementation((collection, id) => {
        if (collection === 'profile_credentials') return Promise.resolve(credentialsWithSecret);
        if (collection === 'auth_policies') return Promise.resolve(mockAuthPolicy);
        return Promise.resolve(null);
      });

      const result = await authService.authenticateProfile(credentialsWithMFA);

      expect(result.success).toBe(true);
      expect(result.sessionToken).toBeDefined();
    });

    it('should detect unrecognized devices', async () => {
      const result = await authService.authenticateProfile(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.securityWarnings).toContain('Unrecognized device detected');
    });

    it('should warn about expired passwords', async () => {
      const expiredCredentials = {
        ...mockStoredCredentials,
        lastPasswordChange: '2023-01-01T00:00:00.000Z' // Old password
      };

      (enhancedDB.get as any).mockImplementation((collection, id) => {
        if (collection === 'profile_credentials') return Promise.resolve(expiredCredentials);
        if (collection === 'auth_policies') return Promise.resolve(mockAuthPolicy);
        return Promise.resolve(null);
      });

      const result = await authService.authenticateProfile(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.securityWarnings).toContain('Password has expired and must be changed');
    });
  });

  describe('changePassword', () => {
    const mockStoredCredentials = {
      profileId: 'test-profile',
      passwordHash: 'old-hashed-password',
      salt: 'test-salt',
      passwordHistory: ['old-hashed-password'],
      lastPasswordChange: '2024-01-01T00:00:00.000Z',
      created: '2024-01-01T00:00:00.000Z',
      modified: '2024-01-01T00:00:00.000Z'
    };

    const mockPasswordPolicy = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      maxAge: 90,
      historyCount: 5
    };

    beforeEach(() => {
      (enhancedDB.get as any).mockImplementation((collection, id) => {
        if (collection === 'profile_credentials') return Promise.resolve(mockStoredCredentials);
        if (collection === 'auth_policies') return Promise.resolve({
          profileId: 'test-profile',
          passwordPolicy: mockPasswordPolicy
        });
        return Promise.resolve(null);
      });

      (enhancedDB.set as any).mockResolvedValue(undefined);
    });

    it('should change password successfully with valid inputs', async () => {
      (EncryptionService.hash as any)
        .mockResolvedValueOnce('old-hashed-password') // Current password verification
        .mockResolvedValueOnce('new-hashed-password'); // New password hash

      const result = await authService.changePassword(
        'test-profile',
        'current-password',
        'NewPassword123'
      );

      expect(result).toBe(true);
      expect(enhancedDB.set).toHaveBeenCalledWith(
        'profile_credentials',
        'test-profile',
        expect.objectContaining({
          passwordHash: 'new-hashed-password',
          passwordHistory: ['new-hashed-password', 'old-hashed-password']
        })
      );
    });

    it('should fail with incorrect current password', async () => {
      (EncryptionService.hash as any).mockResolvedValue('wrong-hash');

      await expect(
        authService.changePassword('test-profile', 'wrong-password', 'NewPassword123')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should fail with weak new password', async () => {
      (EncryptionService.hash as any).mockResolvedValue('old-hashed-password');

      await expect(
        authService.changePassword('test-profile', 'current-password', 'weak')
      ).rejects.toThrow('Password validation failed');
    });

    it('should prevent password reuse', async () => {
      (EncryptionService.hash as any)
        .mockResolvedValueOnce('old-hashed-password') // Current password verification
        .mockResolvedValueOnce('old-hashed-password'); // New password hash (same as old)

      await expect(
        authService.changePassword('test-profile', 'current-password', 'current-password')
      ).rejects.toThrow('New password cannot be the same as a recently used password');
    });
  });

  describe('setupMFA', () => {
    const mockStoredCredentials = {
      profileId: 'test-profile',
      passwordHash: 'hashed-password',
      salt: 'test-salt',
      passwordHistory: ['hashed-password'],
      modified: '2024-01-01T00:00:00.000Z'
    };

    beforeEach(() => {
      (enhancedDB.get as any).mockResolvedValue(mockStoredCredentials);
      (enhancedDB.set as any).mockResolvedValue(undefined);
    });

    it('should setup TOTP MFA successfully', async () => {
      const secret = await authService.setupMFA('test-profile', MFAMethod.TOTP);

      expect(secret).toBeDefined();
      expect(secret).toHaveLength(32);
      expect(enhancedDB.set).toHaveBeenCalledWith(
        'profile_credentials',
        'test-profile',
        expect.objectContaining({
          mfaSecret: secret
        })
      );
    });

    it('should fail for non-existent profile', async () => {
      (enhancedDB.get as any).mockResolvedValue(null);

      await expect(
        authService.setupMFA('non-existent', MFAMethod.TOTP)
      ).rejects.toThrow('Profile credentials not found');
    });
  });

  describe('addBiometric', () => {
    const mockStoredCredentials = {
      profileId: 'test-profile',
      biometricHashes: new Map(),
      modified: '2024-01-01T00:00:00.000Z'
    };

    const mockBiometric = {
      type: 'fingerprint' as const,
      data: 'biometric-data-123',
      confidence: 0.95
    };

    beforeEach(() => {
      (enhancedDB.get as any).mockResolvedValue(mockStoredCredentials);
      (enhancedDB.set as any).mockResolvedValue(undefined);
      (EncryptionService.hash as any).mockResolvedValue('hashed-biometric');
    });

    it('should add biometric successfully', async () => {
      await expect(
        authService.addBiometric('test-profile', mockBiometric)
      ).resolves.not.toThrow();

      expect(enhancedDB.set).toHaveBeenCalledWith(
        'profile_credentials',
        'test-profile',
        expect.objectContaining({
          biometricHashes: expect.any(Map)
        })
      );
    });

    it('should fail for non-existent profile', async () => {
      (enhancedDB.get as any).mockResolvedValue(null);

      await expect(
        authService.addBiometric('non-existent', mockBiometric)
      ).rejects.toThrow('Profile credentials not found');
    });
  });

  describe('session token management', () => {
    it('should validate correct session token', async () => {
      // Create a session token first
      const mockStoredCredentials = {
        profileId: 'test-profile',
        passwordHash: 'hashed-password',
        salt: 'test-salt'
      };

      (enhancedDB.get as any).mockResolvedValue(mockStoredCredentials);
      (EncryptionService.hash as any).mockResolvedValue('hashed-password');

      const authResult = await authService.authenticateProfile(mockCredentials);
      const token = authResult.sessionToken!;

      const isValid = await authService.validateSessionToken('test-profile', token);
      expect(isValid).toBe(true);
    });

    it('should reject invalid session token', async () => {
      const isValid = await authService.validateSessionToken('test-profile', 'invalid-token');
      expect(isValid).toBe(false);
    });

    it('should revoke session token', async () => {
      // Create and then revoke token
      const mockStoredCredentials = {
        profileId: 'test-profile',
        passwordHash: 'hashed-password',
        salt: 'test-salt'
      };

      (enhancedDB.get as any).mockResolvedValue(mockStoredCredentials);
      (EncryptionService.hash as any).mockResolvedValue('hashed-password');

      const authResult = await authService.authenticateProfile(mockCredentials);
      const token = authResult.sessionToken!;

      authService.revokeSessionToken('test-profile');

      const isValid = await authService.validateSessionToken('test-profile', token);
      expect(isValid).toBe(false);
    });
  });

  describe('lockout management', () => {
    it('should increment failed attempts and lock after threshold', async () => {
      const mockStoredCredentials = {
        profileId: 'test-profile',
        passwordHash: 'correct-hash',
        salt: 'test-salt'
      };

      const mockPolicy = {
        lockoutPolicy: {
          maxAttempts: 3,
          lockoutDuration: 15,
          progressiveLockout: false,
          alertOnLockout: false
        }
      };

      (enhancedDB.get as any).mockImplementation((collection, id) => {
        if (collection === 'profile_credentials') return Promise.resolve(mockStoredCredentials);
        if (collection === 'auth_policies') return Promise.resolve(mockPolicy);
        if (collection === 'profile_lockouts') return Promise.resolve({
          profileId: 'test-profile',
          isLocked: false,
          attemptCount: 2 // Already 2 failed attempts
        });
        return Promise.resolve(null);
      });

      (enhancedDB.set as any).mockResolvedValue(undefined);
      (EncryptionService.hash as any).mockResolvedValue('wrong-hash'); // Wrong password

      const result = await authService.authenticateProfile(mockCredentials);

      expect(result.success).toBe(false);
      
      // Should have saved lockout status
      expect(enhancedDB.set).toHaveBeenCalledWith(
        'profile_lockouts',
        'test-profile',
        expect.objectContaining({
          isLocked: true,
          attemptCount: 3
        })
      );
    });

    it('should reset lockout on successful authentication', async () => {
      const mockStoredCredentials = {
        profileId: 'test-profile',
        passwordHash: 'correct-hash',
        salt: 'test-salt'
      };

      (enhancedDB.get as any).mockImplementation((collection, id) => {
        if (collection === 'profile_credentials') return Promise.resolve(mockStoredCredentials);
        if (collection === 'profile_lockouts') return Promise.resolve({
          profileId: 'test-profile',
          isLocked: false,
          attemptCount: 2
        });
        return Promise.resolve({});
      });

      (enhancedDB.set as any).mockResolvedValue(undefined);
      (EncryptionService.hash as any).mockResolvedValue('correct-hash');

      const result = await authService.authenticateProfile(mockCredentials);

      expect(result.success).toBe(true);
      
      // Should have reset lockout status
      expect(enhancedDB.set).toHaveBeenCalledWith(
        'profile_lockouts',
        'test-profile',
        expect.objectContaining({
          isLocked: false,
          attemptCount: 0
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      (enhancedDB.get as any).mockRejectedValue(new Error('Database error'));

      const result = await authService.authenticateProfile(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.failureReason).toBe('Authentication system error');
      expect(result.securityWarnings).toContain('System error occurred during authentication');
    });

    it('should handle encryption errors gracefully', async () => {
      (EncryptionService.hash as any).mockRejectedValue(new Error('Encryption error'));

      await expect(
        authService.createProfileCredentials('test-profile', 'password', SecurityClassification.INTERNAL)
      ).rejects.toThrow('Credential creation failed');
    });
  });
});