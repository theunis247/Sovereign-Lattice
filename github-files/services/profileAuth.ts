/**
 * Profile Authentication System
 * Handles secure profile credential verification, MFA, and authentication policies
 */

import { EncryptionService } from './encryption';
import { enhancedDB } from './enhancedDatabase';
import { SecurityClassification } from './profileManager';

export interface AuthenticationCredentials {
  profileId: string;
  password: string;
  biometric?: BiometricData;
  mfaToken?: string;
  deviceFingerprint?: string;
}

export interface BiometricData {
  type: 'fingerprint' | 'face' | 'voice' | 'iris';
  data: string;
  confidence: number;
}

export interface AuthenticationResult {
  success: boolean;
  profileId: string;
  sessionToken?: string;
  mfaRequired?: boolean;
  lockoutTime?: number;
  failureReason?: string;
  securityWarnings: string[];
}

export interface AuthenticationPolicy {
  profileId: string;
  passwordPolicy: PasswordPolicy;
  mfaPolicy: MFAPolicy;
  lockoutPolicy: LockoutPolicy;
  biometricPolicy: BiometricPolicy;
  devicePolicy: DevicePolicy;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
  historyCount: number; // prevent reuse of last N passwords
}

export interface MFAPolicy {
  required: boolean;
  methods: MFAMethod[];
  backupCodes: boolean;
  timeWindow: number; // seconds
}

export interface LockoutPolicy {
  maxAttempts: number;
  lockoutDuration: number; // minutes
  progressiveLockout: boolean;
  alertOnLockout: boolean;
}

export interface BiometricPolicy {
  enabled: boolean;
  requiredMethods: BiometricData['type'][];
  minConfidence: number;
  fallbackToPassword: boolean;
}

export interface DevicePolicy {
  trustKnownDevices: boolean;
  maxTrustedDevices: number;
  requireDeviceAuth: boolean;
  deviceSessionTimeout: number; // minutes
}

export enum MFAMethod {
  TOTP = 'totp',
  SMS = 'sms',
  EMAIL = 'email',
  HARDWARE_KEY = 'hardware_key',
  BACKUP_CODES = 'backup_codes'
}

export interface StoredCredentials {
  profileId: string;
  passwordHash: string;
  salt: string;
  passwordHistory: string[];
  mfaSecret?: string;
  biometricHashes: Map<BiometricData['type'], string>;
  trustedDevices: TrustedDevice[];
  lastPasswordChange: string;
  created: string;
  modified: string;
}

export interface TrustedDevice {
  deviceId: string;
  fingerprint: string;
  name: string;
  platform: string;
  firstSeen: string;
  lastSeen: string;
  trustLevel: 'low' | 'medium' | 'high';
}

export interface AuthenticationAttempt {
  profileId: string;
  timestamp: string;
  success: boolean;
  method: 'password' | 'biometric' | 'mfa' | 'device';
  deviceFingerprint?: string;
  ipAddress?: string;
  failureReason?: string;
}

export interface LockoutStatus {
  profileId: string;
  isLocked: boolean;
  lockoutStart?: string;
  lockoutEnd?: string;
  attemptCount: number;
  lastAttempt?: string;
}

/**
 * Profile Authentication Service
 * Provides comprehensive authentication with security policies
 */
export class ProfileAuthenticationService {
  private lockoutStatuses: Map<string, LockoutStatus> = new Map();
  private authenticationPolicies: Map<string, AuthenticationPolicy> = new Map();
  private sessionTokens: Map<string, string> = new Map();

  /**
   * Authenticate profile with comprehensive security checks
   */
  public async authenticateProfile(credentials: AuthenticationCredentials): Promise<AuthenticationResult> {
    const warnings: string[] = [];
    
    try {
      // Check if profile is locked out
      const lockoutStatus = await this.checkLockoutStatus(credentials.profileId);
      if (lockoutStatus.isLocked) {
        return {
          success: false,
          profileId: credentials.profileId,
          lockoutTime: lockoutStatus.lockoutEnd ? new Date(lockoutStatus.lockoutEnd).getTime() : undefined,
          failureReason: 'Profile is locked due to too many failed attempts',
          securityWarnings: warnings
        };
      }

      // Get authentication policy for profile
      const policy = await this.getAuthenticationPolicy(credentials.profileId);
      
      // Get stored credentials
      const storedCreds = await this.getStoredCredentials(credentials.profileId);
      if (!storedCreds) {
        await this.recordFailedAttempt(credentials, 'Profile not found');
        return {
          success: false,
          profileId: credentials.profileId,
          failureReason: 'Invalid credentials',
          securityWarnings: warnings
        };
      }

      // Verify password
      const passwordValid = await this.verifyPassword(credentials.password, storedCreds);
      if (!passwordValid) {
        await this.recordFailedAttempt(credentials, 'Invalid password');
        await this.updateLockoutStatus(credentials.profileId, false);
        return {
          success: false,
          profileId: credentials.profileId,
          failureReason: 'Invalid credentials',
          securityWarnings: warnings
        };
      }

      // Check password age
      const passwordAge = this.checkPasswordAge(storedCreds, policy.passwordPolicy);
      if (passwordAge.expired) {
        warnings.push('Password has expired and must be changed');
      }

      // Verify biometric if provided
      if (credentials.biometric && policy.biometricPolicy.enabled) {
        const biometricValid = await this.verifyBiometric(credentials.biometric, storedCreds);
        if (!biometricValid) {
          warnings.push('Biometric verification failed, falling back to password');
        }
      }

      // Check device trust
      const deviceTrust = await this.checkDeviceTrust(credentials, storedCreds, policy.devicePolicy);
      if (!deviceTrust.trusted) {
        warnings.push('Unrecognized device detected');
        
        if (policy.devicePolicy.requireDeviceAuth) {
          return {
            success: false,
            profileId: credentials.profileId,
            mfaRequired: true,
            failureReason: 'Device authentication required',
            securityWarnings: warnings
          };
        }
      }

      // Check MFA requirement
      const mfaRequired = this.isMFARequired(policy.mfaPolicy, deviceTrust.trusted, warnings.length > 0);
      if (mfaRequired && !credentials.mfaToken) {
        return {
          success: true,
          profileId: credentials.profileId,
          mfaRequired: true,
          securityWarnings: warnings
        };
      }

      // Verify MFA if provided
      if (credentials.mfaToken) {
        const mfaValid = await this.verifyMFA(credentials.mfaToken, storedCreds, policy.mfaPolicy);
        if (!mfaValid) {
          await this.recordFailedAttempt(credentials, 'Invalid MFA token');
          await this.updateLockoutStatus(credentials.profileId, false);
          return {
            success: false,
            profileId: credentials.profileId,
            failureReason: 'Invalid MFA token',
            securityWarnings: warnings
          };
        }
      }

      // Generate session token
      const sessionToken = await this.generateSessionToken(credentials.profileId);

      // Record successful authentication
      await this.recordSuccessfulAttempt(credentials);
      await this.updateLockoutStatus(credentials.profileId, true);
      
      // Update device trust if applicable
      if (credentials.deviceFingerprint) {
        await this.updateDeviceTrust(credentials, storedCreds);
      }

      return {
        success: true,
        profileId: credentials.profileId,
        sessionToken,
        securityWarnings: warnings
      };

    } catch (error) {
      console.error('Authentication error:', error);
      await this.recordFailedAttempt(credentials, `System error: ${error.message}`);
      
      return {
        success: false,
        profileId: credentials.profileId,
        failureReason: 'Authentication system error',
        securityWarnings: [...warnings, 'System error occurred during authentication']
      };
    }
  }

  /**
   * Create authentication credentials for new profile
   */
  public async createProfileCredentials(
    profileId: string,
    password: string,
    securityLevel: SecurityClassification
  ): Promise<void> {
    try {
      // Generate salt and hash password
      const salt = this.generateSalt();
      const passwordHash = await this.hashPassword(password, salt);

      // Create stored credentials
      const storedCreds: StoredCredentials = {
        profileId,
        passwordHash,
        salt,
        passwordHistory: [passwordHash],
        biometricHashes: new Map(),
        trustedDevices: [],
        lastPasswordChange: new Date().toISOString(),
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      };

      // Store credentials
      await enhancedDB.set('profile_credentials', profileId, storedCreds);

      // Create authentication policy based on security level
      const policy = this.createAuthenticationPolicy(profileId, securityLevel);
      await this.setAuthenticationPolicy(profileId, policy);

      console.log(`Created authentication credentials for profile ${profileId}`);
    } catch (error) {
      console.error('Failed to create profile credentials:', error);
      throw new Error(`Credential creation failed: ${error.message}`);
    }
  }

  /**
   * Change profile password with security validation
   */
  public async changePassword(
    profileId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      // Get stored credentials
      const storedCreds = await this.getStoredCredentials(profileId);
      if (!storedCreds) {
        throw new Error('Profile credentials not found');
      }

      // Verify current password
      const currentValid = await this.verifyPassword(currentPassword, storedCreds);
      if (!currentValid) {
        throw new Error('Current password is incorrect');
      }

      // Get authentication policy
      const policy = await this.getAuthenticationPolicy(profileId);
      
      // Validate new password against policy
      const passwordValidation = this.validatePassword(newPassword, policy.passwordPolicy);
      if (!passwordValidation.valid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Check password history
      const historyCheck = await this.checkPasswordHistory(newPassword, storedCreds, policy.passwordPolicy);
      if (!historyCheck.valid) {
        throw new Error('New password cannot be the same as a recently used password');
      }

      // Generate new salt and hash
      const salt = this.generateSalt();
      const passwordHash = await this.hashPassword(newPassword, salt);

      // Update stored credentials
      storedCreds.passwordHash = passwordHash;
      storedCreds.salt = salt;
      storedCreds.passwordHistory.unshift(passwordHash);
      
      // Keep only required history count
      if (storedCreds.passwordHistory.length > policy.passwordPolicy.historyCount) {
        storedCreds.passwordHistory = storedCreds.passwordHistory.slice(0, policy.passwordPolicy.historyCount);
      }
      
      storedCreds.lastPasswordChange = new Date().toISOString();
      storedCreds.modified = new Date().toISOString();

      // Save updated credentials
      await enhancedDB.set('profile_credentials', profileId, storedCreds);

      console.log(`Password changed for profile ${profileId}`);
      return true;
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  /**
   * Setup MFA for profile
   */
  public async setupMFA(profileId: string, method: MFAMethod): Promise<string> {
    try {
      const storedCreds = await this.getStoredCredentials(profileId);
      if (!storedCreds) {
        throw new Error('Profile credentials not found');
      }

      let secret: string;

      switch (method) {
        case MFAMethod.TOTP:
          secret = this.generateTOTPSecret();
          storedCreds.mfaSecret = secret;
          break;
        
        default:
          throw new Error(`MFA method ${method} not yet implemented`);
      }

      storedCreds.modified = new Date().toISOString();
      await enhancedDB.set('profile_credentials', profileId, storedCreds);

      return secret;
    } catch (error) {
      console.error('Failed to setup MFA:', error);
      throw error;
    }
  }

  /**
   * Add biometric authentication
   */
  public async addBiometric(
    profileId: string,
    biometric: BiometricData
  ): Promise<void> {
    try {
      const storedCreds = await this.getStoredCredentials(profileId);
      if (!storedCreds) {
        throw new Error('Profile credentials not found');
      }

      // Hash biometric data
      const biometricHash = await this.hashBiometric(biometric);
      storedCreds.biometricHashes.set(biometric.type, biometricHash);
      storedCreds.modified = new Date().toISOString();

      await enhancedDB.set('profile_credentials', profileId, storedCreds);

      console.log(`Added ${biometric.type} biometric for profile ${profileId}`);
    } catch (error) {
      console.error('Failed to add biometric:', error);
      throw error;
    }
  }

  /**
   * Validate session token
   */
  public async validateSessionToken(profileId: string, token: string): Promise<boolean> {
    const storedToken = this.sessionTokens.get(profileId);
    return storedToken === token;
  }

  /**
   * Revoke session token
   */
  public revokeSessionToken(profileId: string): void {
    this.sessionTokens.delete(profileId);
  }

  // Private helper methods

  private async checkLockoutStatus(profileId: string): Promise<LockoutStatus> {
    let status = this.lockoutStatuses.get(profileId);
    
    if (!status) {
      // Load from database
      const stored = await enhancedDB.get<LockoutStatus>('profile_lockouts', profileId);
      status = stored || {
        profileId,
        isLocked: false,
        attemptCount: 0
      };
      this.lockoutStatuses.set(profileId, status);
    }

    // Check if lockout has expired
    if (status.isLocked && status.lockoutEnd) {
      const now = new Date();
      const lockoutEnd = new Date(status.lockoutEnd);
      
      if (now > lockoutEnd) {
        status.isLocked = false;
        status.attemptCount = 0;
        delete status.lockoutStart;
        delete status.lockoutEnd;
        await this.saveLockoutStatus(status);
      }
    }

    return status;
  }

  private async updateLockoutStatus(profileId: string, success: boolean): Promise<void> {
    const status = await this.checkLockoutStatus(profileId);
    const policy = await this.getAuthenticationPolicy(profileId);

    if (success) {
      // Reset on successful authentication
      status.attemptCount = 0;
      status.isLocked = false;
      delete status.lockoutStart;
      delete status.lockoutEnd;
    } else {
      // Increment failed attempts
      status.attemptCount++;
      status.lastAttempt = new Date().toISOString();

      // Check if lockout threshold reached
      if (status.attemptCount >= policy.lockoutPolicy.maxAttempts) {
        status.isLocked = true;
        status.lockoutStart = new Date().toISOString();
        
        // Calculate lockout duration (progressive if enabled)
        let duration = policy.lockoutPolicy.lockoutDuration;
        if (policy.lockoutPolicy.progressiveLockout) {
          const multiplier = Math.min(status.attemptCount - policy.lockoutPolicy.maxAttempts + 1, 5);
          duration *= multiplier;
        }
        
        status.lockoutEnd = new Date(Date.now() + duration * 60 * 1000).toISOString();
      }
    }

    await this.saveLockoutStatus(status);
  }

  private async saveLockoutStatus(status: LockoutStatus): Promise<void> {
    this.lockoutStatuses.set(status.profileId, status);
    await enhancedDB.set('profile_lockouts', status.profileId, status);
  }

  private async getAuthenticationPolicy(profileId: string): Promise<AuthenticationPolicy> {
    let policy = this.authenticationPolicies.get(profileId);
    
    if (!policy) {
      const stored = await enhancedDB.get<AuthenticationPolicy>('auth_policies', profileId);
      if (stored) {
        policy = stored;
        this.authenticationPolicies.set(profileId, policy);
      } else {
        // Create default policy
        policy = this.createAuthenticationPolicy(profileId, SecurityClassification.INTERNAL);
        await this.setAuthenticationPolicy(profileId, policy);
      }
    }

    return policy;
  }

  private async setAuthenticationPolicy(profileId: string, policy: AuthenticationPolicy): Promise<void> {
    this.authenticationPolicies.set(profileId, policy);
    await enhancedDB.set('auth_policies', profileId, policy);
  }

  private createAuthenticationPolicy(profileId: string, securityLevel: SecurityClassification): AuthenticationPolicy {
    const isHighSecurity = securityLevel === SecurityClassification.SECRET || 
                          securityLevel === SecurityClassification.TOP_SECRET;

    return {
      profileId,
      passwordPolicy: {
        minLength: isHighSecurity ? 12 : 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: isHighSecurity,
        maxAge: isHighSecurity ? 60 : 90,
        historyCount: isHighSecurity ? 10 : 5
      },
      mfaPolicy: {
        required: isHighSecurity,
        methods: [MFAMethod.TOTP],
        backupCodes: true,
        timeWindow: 30
      },
      lockoutPolicy: {
        maxAttempts: isHighSecurity ? 3 : 5,
        lockoutDuration: isHighSecurity ? 30 : 15,
        progressiveLockout: true,
        alertOnLockout: isHighSecurity
      },
      biometricPolicy: {
        enabled: true,
        requiredMethods: [],
        minConfidence: 0.8,
        fallbackToPassword: true
      },
      devicePolicy: {
        trustKnownDevices: true,
        maxTrustedDevices: isHighSecurity ? 3 : 5,
        requireDeviceAuth: isHighSecurity,
        deviceSessionTimeout: isHighSecurity ? 60 : 120
      }
    };
  }

  private async getStoredCredentials(profileId: string): Promise<StoredCredentials | null> {
    return await enhancedDB.get<StoredCredentials>('profile_credentials', profileId);
  }

  private async verifyPassword(password: string, storedCreds: StoredCredentials): Promise<boolean> {
    const hash = await this.hashPassword(password, storedCreds.salt);
    return hash === storedCreds.passwordHash;
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return await EncryptionService.hash(password + salt);
  }

  private generateSalt(): string {
    return EncryptionService.generateSecurePassword().substring(0, 16);
  }

  private checkPasswordAge(storedCreds: StoredCredentials, policy: PasswordPolicy): { expired: boolean; daysOld: number } {
    const lastChange = new Date(storedCreds.lastPasswordChange);
    const now = new Date();
    const daysOld = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      expired: daysOld > policy.maxAge,
      daysOld
    };
  }

  private validatePassword(password: string, policy: PasswordPolicy): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain numbers');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain special characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async checkPasswordHistory(
    newPassword: string,
    storedCreds: StoredCredentials,
    policy: PasswordPolicy
  ): Promise<{ valid: boolean }> {
    const newHash = await this.hashPassword(newPassword, storedCreds.salt);
    const isReused = storedCreds.passwordHistory.includes(newHash);
    
    return { valid: !isReused };
  }

  private async verifyBiometric(biometric: BiometricData, storedCreds: StoredCredentials): Promise<boolean> {
    const storedHash = storedCreds.biometricHashes.get(biometric.type);
    if (!storedHash) {
      return false;
    }

    const providedHash = await this.hashBiometric(biometric);
    return storedHash === providedHash;
  }

  private async hashBiometric(biometric: BiometricData): Promise<string> {
    return await EncryptionService.hash(biometric.data + biometric.type);
  }

  private async checkDeviceTrust(
    credentials: AuthenticationCredentials,
    storedCreds: StoredCredentials,
    policy: DevicePolicy
  ): Promise<{ trusted: boolean; device?: TrustedDevice }> {
    if (!credentials.deviceFingerprint || !policy.trustKnownDevices) {
      return { trusted: false };
    }

    const trustedDevice = storedCreds.trustedDevices.find(
      device => device.fingerprint === credentials.deviceFingerprint
    );

    return {
      trusted: !!trustedDevice,
      device: trustedDevice
    };
  }

  private isMFARequired(policy: MFAPolicy, deviceTrusted: boolean, hasWarnings: boolean): boolean {
    if (policy.required) {
      return true;
    }

    // Require MFA for untrusted devices or when there are security warnings
    return !deviceTrusted || hasWarnings;
  }

  private async verifyMFA(token: string, storedCreds: StoredCredentials, policy: MFAPolicy): Promise<boolean> {
    if (!storedCreds.mfaSecret) {
      return false;
    }

    // For TOTP verification (simplified implementation)
    return this.verifyTOTP(token, storedCreds.mfaSecret, policy.timeWindow);
  }

  private verifyTOTP(token: string, secret: string, timeWindow: number): boolean {
    // Simplified TOTP verification - in production, use a proper TOTP library
    const currentTime = Math.floor(Date.now() / 1000 / timeWindow);
    const expectedToken = this.generateTOTP(secret, currentTime);
    
    return token === expectedToken;
  }

  private generateTOTPSecret(): string {
    return EncryptionService.generateSecurePassword().substring(0, 32);
  }

  private generateTOTP(secret: string, timeStep: number): string {
    // Simplified TOTP generation - in production, use a proper TOTP library
    const hash = secret + timeStep.toString();
    return (parseInt(hash.substring(0, 6), 36) % 1000000).toString().padStart(6, '0');
  }

  private async generateSessionToken(profileId: string): Promise<string> {
    const token = EncryptionService.generateSecurePassword();
    this.sessionTokens.set(profileId, token);
    
    // Set token expiration (cleanup after 24 hours)
    setTimeout(() => {
      this.sessionTokens.delete(profileId);
    }, 24 * 60 * 60 * 1000);
    
    return token;
  }

  private async updateDeviceTrust(
    credentials: AuthenticationCredentials,
    storedCreds: StoredCredentials
  ): Promise<void> {
    if (!credentials.deviceFingerprint) {
      return;
    }

    const existingDevice = storedCreds.trustedDevices.find(
      device => device.fingerprint === credentials.deviceFingerprint
    );

    if (existingDevice) {
      existingDevice.lastSeen = new Date().toISOString();
    } else {
      // Add new trusted device
      const newDevice: TrustedDevice = {
        deviceId: `device_${Date.now()}`,
        fingerprint: credentials.deviceFingerprint,
        name: 'Unknown Device',
        platform: 'Unknown',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        trustLevel: 'medium'
      };

      storedCreds.trustedDevices.push(newDevice);
      
      // Limit number of trusted devices
      const policy = await this.getAuthenticationPolicy(storedCreds.profileId);
      if (storedCreds.trustedDevices.length > policy.devicePolicy.maxTrustedDevices) {
        // Remove oldest device
        storedCreds.trustedDevices.sort((a, b) => 
          new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime()
        );
        storedCreds.trustedDevices.shift();
      }
    }

    storedCreds.modified = new Date().toISOString();
    await enhancedDB.set('profile_credentials', storedCreds.profileId, storedCreds);
  }

  private async recordSuccessfulAttempt(credentials: AuthenticationCredentials): Promise<void> {
    const attempt: AuthenticationAttempt = {
      profileId: credentials.profileId,
      timestamp: new Date().toISOString(),
      success: true,
      method: credentials.mfaToken ? 'mfa' : credentials.biometric ? 'biometric' : 'password',
      deviceFingerprint: credentials.deviceFingerprint
    };

    await this.saveAuthenticationAttempt(attempt);
  }

  private async recordFailedAttempt(credentials: AuthenticationCredentials, reason: string): Promise<void> {
    const attempt: AuthenticationAttempt = {
      profileId: credentials.profileId,
      timestamp: new Date().toISOString(),
      success: false,
      method: 'password',
      deviceFingerprint: credentials.deviceFingerprint,
      failureReason: reason
    };

    await this.saveAuthenticationAttempt(attempt);
  }

  private async saveAuthenticationAttempt(attempt: AuthenticationAttempt): Promise<void> {
    const attemptId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await enhancedDB.set('auth_attempts', attemptId, attempt);
  }
}

// Singleton instance
export const profileAuth = new ProfileAuthenticationService();