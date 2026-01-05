/**
 * Profile Context Management
 * Manages active profile context, session handling, and secure profile switching
 */

import { ProfileContext, ProfileManager, SecurityClassification } from './profileManager';
import { enhancedDB } from './enhancedDatabase';

export interface ProfileSession {
  sessionId: string;
  profileId: string;
  startTime: string;
  lastActivity: string;
  isActive: boolean;
  securityLevel: SecurityClassification;
  deviceInfo: DeviceInfo;
  permissions: ProfilePermissions;
}

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  browser: string;
  ipAddress?: string;
  location?: string;
}

export interface ProfilePermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExport: boolean;
  canShare: boolean;
  canAdmin: boolean;
}

export interface ProfileSwitchResult {
  success: boolean;
  previousProfile?: string;
  newProfile: string;
  sessionId: string;
  warnings: string[];
}

export interface ProfileContextState {
  activeProfile: ProfileContext | null;
  activeSession: ProfileSession | null;
  profileHistory: ProfileHistoryEntry[];
  securityContext: SecurityContext;
}

export interface ProfileHistoryEntry {
  profileId: string;
  username: string;
  accessTime: string;
  sessionDuration: number;
  activityCount: number;
}

export interface SecurityContext {
  encryptionKeys: Map<string, CryptoKey>;
  accessTokens: Map<string, string>;
  securityLevel: SecurityClassification;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  lastSecurityCheck: string;
}

/**
 * Profile Context Manager
 * Handles active profile context and secure session management
 */
export class ProfileContextManager {
  private contextState: ProfileContextState;
  private sessionTimeout: number = 30 * 60 * 1000; // 30 minutes
  private securityCheckInterval: number = 5 * 60 * 1000; // 5 minutes
  private profileManager: ProfileManager;
  private sessionCleanupTimer?: NodeJS.Timeout;
  private securityCheckTimer?: NodeJS.Timeout;

  constructor(profileManager: ProfileManager) {
    this.profileManager = profileManager;
    this.contextState = {
      activeProfile: null,
      activeSession: null,
      profileHistory: [],
      securityContext: {
        encryptionKeys: new Map(),
        accessTokens: new Map(),
        securityLevel: SecurityClassification.INTERNAL,
        threatLevel: 'low',
        lastSecurityCheck: new Date().toISOString()
      }
    };

    this.startBackgroundTasks();
  }

  /**
   * Initialize profile context with security validation
   */
  public async initializeContext(profileId: string): Promise<ProfileContext> {
    try {
      // Get profile from manager
      const profile = await this.profileManager.getCurrentProfile();
      if (!profile || profile.profileId !== profileId) {
        throw new Error('Profile not active in manager');
      }

      // Create secure session
      const session = await this.createSecureSession(profile);

      // Initialize security context
      await this.initializeSecurityContext(profile);

      // Set active context
      this.contextState.activeProfile = profile;
      this.contextState.activeSession = session;

      // Add to history
      this.addToProfileHistory(profile);

      // Start session monitoring
      this.startSessionMonitoring(session);

      console.log(`Profile context initialized for ${profileId}`);
      return profile;
    } catch (error) {
      console.error('Failed to initialize profile context:', error);
      throw new Error(`Context initialization failed: ${error.message}`);
    }
  }

  /**
   * Switch profile context with proper cleanup
   */
  public async switchProfileContext(
    newProfileId: string,
    credentials: any
  ): Promise<ProfileSwitchResult> {
    const warnings: string[] = [];
    let previousProfile: string | undefined;

    try {
      // Store previous profile info
      if (this.contextState.activeProfile) {
        previousProfile = this.contextState.activeProfile.profileId;
        
        // Cleanup previous context
        await this.cleanupProfileContext(this.contextState.activeProfile.profileId);
      }

      // Switch profile in manager
      const newProfile = await this.profileManager.switchProfile(newProfileId, credentials);

      // Initialize new context
      await this.initializeContext(newProfileId);

      // Verify context switch security
      const securityCheck = await this.verifyContextSwitchSecurity(previousProfile, newProfileId);
      if (!securityCheck.passed) {
        warnings.push(...securityCheck.warnings);
      }

      return {
        success: true,
        previousProfile,
        newProfile: newProfileId,
        sessionId: this.contextState.activeSession!.sessionId,
        warnings
      };
    } catch (error) {
      console.error('Failed to switch profile context:', error);
      
      // Attempt to restore previous context if possible
      if (previousProfile) {
        try {
          await this.restorePreviousContext(previousProfile);
          warnings.push('Restored previous profile context after switch failure');
        } catch (restoreError) {
          console.error('Failed to restore previous context:', restoreError);
          warnings.push('Failed to restore previous context');
        }
      }

      return {
        success: false,
        previousProfile,
        newProfile: newProfileId,
        sessionId: '',
        warnings: [...warnings, error.message]
      };
    }
  }

  /**
   * Get current active profile context
   */
  public getActiveProfile(): ProfileContext | null {
    return this.contextState.activeProfile;
  }

  /**
   * Get current active session
   */
  public getActiveSession(): ProfileSession | null {
    return this.contextState.activeSession;
  }

  /**
   * Get profile access history
   */
  public getProfileHistory(): ProfileHistoryEntry[] {
    return [...this.contextState.profileHistory];
  }

  /**
   * Get current security context
   */
  public getSecurityContext(): SecurityContext {
    return { ...this.contextState.securityContext };
  }

  /**
   * Validate current context security
   */
  public async validateContextSecurity(): Promise<boolean> {
    try {
      if (!this.contextState.activeProfile || !this.contextState.activeSession) {
        return false;
      }

      // Check session validity
      const sessionValid = await this.validateSession(this.contextState.activeSession);
      if (!sessionValid) {
        await this.invalidateContext('Session expired');
        return false;
      }

      // Check security context
      const securityValid = await this.validateSecurityContext();
      if (!securityValid) {
        await this.invalidateContext('Security validation failed');
        return false;
      }

      // Update last security check
      this.contextState.securityContext.lastSecurityCheck = new Date().toISOString();

      return true;
    } catch (error) {
      console.error('Context security validation failed:', error);
      await this.invalidateContext('Security validation error');
      return false;
    }
  }

  /**
   * Cleanup and invalidate current context
   */
  public async invalidateContext(reason: string): Promise<void> {
    try {
      const profileId = this.contextState.activeProfile?.profileId;
      
      if (profileId) {
        await this.cleanupProfileContext(profileId);
      }

      // Clear context state
      this.contextState.activeProfile = null;
      this.contextState.activeSession = null;
      this.contextState.securityContext.encryptionKeys.clear();
      this.contextState.securityContext.accessTokens.clear();
      this.contextState.securityContext.threatLevel = 'medium';

      console.log(`Profile context invalidated: ${reason}`);
    } catch (error) {
      console.error('Failed to invalidate context:', error);
    }
  }

  /**
   * Update profile activity and extend session
   */
  public async updateActivity(): Promise<void> {
    if (this.contextState.activeSession) {
      this.contextState.activeSession.lastActivity = new Date().toISOString();
      
      // Update session in database
      await this.saveSession(this.contextState.activeSession);
      
      // Update history entry
      this.updateProfileHistoryActivity();
    }
  }

  /**
   * Check if profile has specific permission
   */
  public hasPermission(permission: keyof ProfilePermissions): boolean {
    return this.contextState.activeSession?.permissions[permission] || false;
  }

  /**
   * Get profile-specific encryption key
   */
  public getEncryptionKey(keyType: string): CryptoKey | null {
    return this.contextState.securityContext.encryptionKeys.get(keyType) || null;
  }

  /**
   * Set profile-specific encryption key
   */
  public setEncryptionKey(keyType: string, key: CryptoKey): void {
    this.contextState.securityContext.encryptionKeys.set(keyType, key);
  }

  // Private helper methods

  private async createSecureSession(profile: ProfileContext): Promise<ProfileSession> {
    const sessionId = this.generateSessionId();
    const deviceInfo = await this.getDeviceInfo();
    const permissions = this.determinePermissions(profile);

    const session: ProfileSession = {
      sessionId,
      profileId: profile.profileId,
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isActive: true,
      securityLevel: profile.securityLevel,
      deviceInfo,
      permissions
    };

    // Save session to database
    await this.saveSession(session);

    return session;
  }

  private async initializeSecurityContext(profile: ProfileContext): Promise<void> {
    // Set security level
    this.contextState.securityContext.securityLevel = profile.securityLevel;
    
    // Initialize encryption keys (would be derived from profile keys in production)
    // For now, we'll use placeholder keys
    this.contextState.securityContext.encryptionKeys.set('data', await this.generateDataKey(profile));
    this.contextState.securityContext.encryptionKeys.set('sync', await this.generateSyncKey(profile));
    
    // Set initial threat level based on security level
    this.contextState.securityContext.threatLevel = 
      profile.securityLevel === SecurityClassification.SECRET ? 'low' : 'medium';
    
    this.contextState.securityContext.lastSecurityCheck = new Date().toISOString();
  }

  private async cleanupProfileContext(profileId: string): Promise<void> {
    try {
      // End current session
      if (this.contextState.activeSession) {
        this.contextState.activeSession.isActive = false;
        await this.saveSession(this.contextState.activeSession);
      }

      // Clear encryption keys
      this.contextState.securityContext.encryptionKeys.clear();
      this.contextState.securityContext.accessTokens.clear();

      // Stop session monitoring
      this.stopSessionMonitoring();

      console.log(`Cleaned up context for profile ${profileId}`);
    } catch (error) {
      console.error('Failed to cleanup profile context:', error);
    }
  }

  private addToProfileHistory(profile: ProfileContext): void {
    const existingIndex = this.contextState.profileHistory.findIndex(
      entry => entry.profileId === profile.profileId
    );

    const historyEntry: ProfileHistoryEntry = {
      profileId: profile.profileId,
      username: profile.username,
      accessTime: new Date().toISOString(),
      sessionDuration: 0,
      activityCount: 1
    };

    if (existingIndex >= 0) {
      // Update existing entry
      this.contextState.profileHistory[existingIndex] = historyEntry;
    } else {
      // Add new entry
      this.contextState.profileHistory.unshift(historyEntry);
      
      // Keep only last 10 entries
      if (this.contextState.profileHistory.length > 10) {
        this.contextState.profileHistory = this.contextState.profileHistory.slice(0, 10);
      }
    }
  }

  private updateProfileHistoryActivity(): void {
    if (this.contextState.profileHistory.length > 0 && this.contextState.activeProfile) {
      const currentEntry = this.contextState.profileHistory.find(
        entry => entry.profileId === this.contextState.activeProfile!.profileId
      );
      
      if (currentEntry) {
        currentEntry.activityCount++;
        const startTime = new Date(currentEntry.accessTime).getTime();
        currentEntry.sessionDuration = Date.now() - startTime;
      }
    }
  }

  private async verifyContextSwitchSecurity(
    previousProfile?: string,
    newProfile?: string
  ): Promise<{ passed: boolean; warnings: string[] }> {
    const warnings: string[] = [];
    let passed = true;

    // Check for rapid profile switching (potential security risk)
    if (previousProfile && this.contextState.profileHistory.length > 0) {
      const lastSwitch = new Date(this.contextState.profileHistory[0].accessTime).getTime();
      const timeSinceLastSwitch = Date.now() - lastSwitch;
      
      if (timeSinceLastSwitch < 30000) { // Less than 30 seconds
        warnings.push('Rapid profile switching detected');
        this.contextState.securityContext.threatLevel = 'medium';
      }
    }

    // Check for security level changes
    if (previousProfile && newProfile) {
      const prevProfile = await this.profileManager.getCurrentProfile();
      if (prevProfile && this.contextState.activeProfile) {
        if (prevProfile.securityLevel !== this.contextState.activeProfile.securityLevel) {
          warnings.push('Security level changed during profile switch');
        }
      }
    }

    return { passed, warnings };
  }

  private async restorePreviousContext(profileId: string): Promise<void> {
    // Attempt to restore previous profile context
    // This is a simplified implementation
    console.log(`Attempting to restore context for profile ${profileId}`);
  }

  private async validateSession(session: ProfileSession): Promise<boolean> {
    // Check if session has expired
    const lastActivity = new Date(session.lastActivity).getTime();
    const now = Date.now();
    
    if (now - lastActivity > this.sessionTimeout) {
      return false;
    }

    // Check if session is still active
    if (!session.isActive) {
      return false;
    }

    return true;
  }

  private async validateSecurityContext(): Promise<boolean> {
    // Check if security context is still valid
    const lastCheck = new Date(this.contextState.securityContext.lastSecurityCheck).getTime();
    const now = Date.now();
    
    // Security context expires after 1 hour
    if (now - lastCheck > 60 * 60 * 1000) {
      return false;
    }

    // Check if encryption keys are still valid
    if (this.contextState.securityContext.encryptionKeys.size === 0) {
      return false;
    }

    return true;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getDeviceInfo(): Promise<DeviceInfo> {
    return {
      deviceId: `device_${Math.random().toString(36).substr(2, 9)}`,
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
      browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };
  }

  private determinePermissions(profile: ProfileContext): ProfilePermissions {
    // Determine permissions based on profile security level
    const isHighSecurity = profile.securityLevel === SecurityClassification.SECRET ||
                          profile.securityLevel === SecurityClassification.TOP_SECRET;

    return {
      canRead: true,
      canWrite: true,
      canDelete: !isHighSecurity, // High security profiles require additional confirmation
      canExport: !isHighSecurity,
      canShare: false, // Sharing disabled by default for security
      canAdmin: profile.securityLevel === SecurityClassification.SECRET
    };
  }

  private async generateDataKey(profile: ProfileContext): Promise<CryptoKey> {
    // Generate a data encryption key for the profile
    // This is a simplified implementation - in production, this would derive from profile keys
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async generateSyncKey(profile: ProfileContext): Promise<CryptoKey> {
    // Generate a sync encryption key for the profile
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async saveSession(session: ProfileSession): Promise<void> {
    try {
      await enhancedDB.set('profile_sessions', session.sessionId, session);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  private startSessionMonitoring(session: ProfileSession): void {
    // Start monitoring session activity
    this.sessionCleanupTimer = setInterval(() => {
      this.checkSessionExpiry();
    }, 60000); // Check every minute
  }

  private stopSessionMonitoring(): void {
    if (this.sessionCleanupTimer) {
      clearInterval(this.sessionCleanupTimer);
      this.sessionCleanupTimer = undefined;
    }
  }

  private async checkSessionExpiry(): Promise<void> {
    if (this.contextState.activeSession) {
      const isValid = await this.validateSession(this.contextState.activeSession);
      if (!isValid) {
        await this.invalidateContext('Session expired');
      }
    }
  }

  private startBackgroundTasks(): void {
    // Start periodic security checks
    this.securityCheckTimer = setInterval(() => {
      this.validateContextSecurity();
    }, this.securityCheckInterval);
  }

  private stopBackgroundTasks(): void {
    if (this.sessionCleanupTimer) {
      clearInterval(this.sessionCleanupTimer);
    }
    if (this.securityCheckTimer) {
      clearInterval(this.securityCheckTimer);
    }
  }

  /**
   * Cleanup when context manager is destroyed
   */
  public destroy(): void {
    this.stopBackgroundTasks();
    this.stopSessionMonitoring();
    this.invalidateContext('Context manager destroyed');
  }
}

// Export singleton instance factory
export function createProfileContextManager(profileManager: ProfileManager): ProfileContextManager {
  return new ProfileContextManager(profileManager);
}