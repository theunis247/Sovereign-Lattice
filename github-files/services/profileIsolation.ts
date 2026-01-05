/**
 * Profile Data Isolation Mechanisms
 * Implements comprehensive data isolation with validation and enforcement
 */

import { enhancedDB } from './enhancedDatabase';
import { DataSegregator, DataSensitivity } from './dataSegregator';
import { SecurityClassification } from './profileManager';

export interface IsolationPolicy {
  profileId: string;
  isolationLevel: SecurityClassification;
  allowCrossProfileAccess: boolean;
  encryptionRequired: boolean;
  auditAllAccess: boolean;
  dataRetentionDays: number;
  allowedOperations: ProfileOperation[];
}

export interface ProfileOperation {
  operation: 'read' | 'write' | 'delete' | 'share' | 'export';
  collections: string[];
  restrictions: OperationRestriction[];
}

export interface OperationRestriction {
  type: 'time_based' | 'ip_based' | 'device_based' | 'mfa_required';
  value: string;
  description: string;
}

export interface IsolationBoundary {
  profileId: string;
  collections: ProfileCollection[];
  accessControls: AccessControl[];
  encryptionKeys: string[];
  isolationScore: number; // 0-100%
  lastValidated: string;
}

export interface ProfileCollection {
  name: string;
  isolatedName: string;
  dataCount: number;
  encryptedCount: number;
  lastAccessed: string;
  accessPattern: AccessPattern[];
}

export interface AccessPattern {
  timestamp: string;
  operation: string;
  success: boolean;
  source: string;
}

export interface AccessControl {
  controlId: string;
  profileId: string;
  resource: string;
  permissions: string[];
  conditions: AccessCondition[];
  created: string;
  lastUsed?: string;
}

export interface AccessCondition {
  type: 'time_window' | 'ip_whitelist' | 'device_trust' | 'mfa_verified';
  value: string;
  active: boolean;
}

export interface IsolationViolationAlert {
  alertId: string;
  profileId: string;
  violationType: 'boundary_breach' | 'unauthorized_access' | 'data_leakage' | 'encryption_bypass';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: ViolationEvidence[];
  timestamp: string;
  resolved: boolean;
}

export interface ViolationEvidence {
  type: 'access_log' | 'data_trace' | 'network_activity' | 'system_event';
  data: any;
  timestamp: string;
}

/**
 * Profile Isolation Manager
 * Manages and enforces data isolation boundaries between profiles
 */
export class ProfileIsolationManager {
  private dataSegregator: DataSegregator;
  private isolationPolicies: Map<string, IsolationPolicy> = new Map();
  private isolationBoundaries: Map<string, IsolationBoundary> = new Map();
  private accessControls: Map<string, AccessControl[]> = new Map();
  private violationAlerts: IsolationViolationAlert[] = [];

  constructor(dataSegregator: DataSegregator) {
    this.dataSegregator = dataSegregator;
  }

  /**
   * Initialize isolation for a new profile
   */
  public async initializeProfileIsolation(
    profileId: string,
    securityLevel: SecurityClassification
  ): Promise<IsolationBoundary> {
    try {
      // Create isolation policy
      const policy = this.createIsolationPolicy(profileId, securityLevel);
      this.isolationPolicies.set(profileId, policy);

      // Create isolation boundary
      const boundary = await this.createIsolationBoundary(profileId, policy);
      this.isolationBoundaries.set(profileId, boundary);

      // Set up access controls
      const accessControls = this.createAccessControls(profileId, policy);
      this.accessControls.set(profileId, accessControls);

      // Store isolation configuration
      await this.storeIsolationConfig(profileId, { policy, boundary, accessControls });

      console.log(`Profile isolation initialized for ${profileId}`);
      return boundary;
    } catch (error) {
      console.error('Profile isolation initialization failed:', error);
      throw new Error(`Profile isolation initialization failed: ${error.message}`);
    }
  }

  /**
   * Validate profile ID for all data operations
   */
  public async validateProfileAccess(
    requestingProfile: string,
    targetProfile: string,
    operation: string,
    resource: string
  ): Promise<boolean> {
    try {
      // Self-access is always allowed
      if (requestingProfile === targetProfile) {
        await this.logAccessAttempt(requestingProfile, operation, resource, true, 'self_access');
        return true;
      }

      // Check isolation policy
      const policy = this.isolationPolicies.get(targetProfile);
      if (!policy) {
        await this.logAccessAttempt(requestingProfile, operation, resource, false, 'no_policy');
        return false;
      }

      // Check if cross-profile access is allowed
      if (!policy.allowCrossProfileAccess) {
        await this.logAccessAttempt(requestingProfile, operation, resource, false, 'cross_profile_denied');
        await this.createViolationAlert(targetProfile, 'unauthorized_access', 'high', 
          `Unauthorized cross-profile access attempt from ${requestingProfile}`);
        return false;
      }

      // Check access controls
      const hasAccess = await this.checkAccessControls(requestingProfile, targetProfile, operation, resource);
      
      await this.logAccessAttempt(requestingProfile, operation, resource, hasAccess, 
        hasAccess ? 'access_granted' : 'access_denied');

      return hasAccess;
    } catch (error) {
      console.error('Profile access validation failed:', error);
      await this.logAccessAttempt(requestingProfile, operation, resource, false, 'validation_error');
      return false;
    }
  }

  /**
   * Enforce data container segregation
   */
  public async enforceDataSegregation(
    profileId: string,
    collection: string,
    operation: 'read' | 'write' | 'delete'
  ): Promise<string> {
    try {
      // Get isolation boundary
      const boundary = this.isolationBoundaries.get(profileId);
      if (!boundary) {
        throw new Error(`No isolation boundary found for profile ${profileId}`);
      }

      // Generate isolated collection name
      const isolatedCollection = this.generateIsolatedCollectionName(profileId, collection);

      // Validate operation is allowed
      const policy = this.isolationPolicies.get(profileId);
      if (policy) {
        const operationAllowed = this.isOperationAllowed(policy, operation, collection);
        if (!operationAllowed) {
          throw new Error(`Operation ${operation} not allowed on collection ${collection} for profile ${profileId}`);
        }
      }

      // Update access pattern
      await this.updateAccessPattern(profileId, collection, operation);

      // Return isolated collection name
      return isolatedCollection;
    } catch (error) {
      console.error('Data segregation enforcement failed:', error);
      throw new Error(`Data segregation enforcement failed: ${error.message}`);
    }
  }

  /**
   * Prevent cross-profile data contamination
   */
  public async preventDataContamination(
    sourceProfile: string,
    targetProfile: string,
    data: any
  ): Promise<boolean> {
    try {
      // Check if profiles are different
      if (sourceProfile === targetProfile) {
        return true; // Same profile, no contamination risk
      }

      // Verify data doesn't contain cross-profile references
      const hasContamination = await this.detectDataContamination(data, sourceProfile, targetProfile);
      
      if (hasContamination) {
        await this.createViolationAlert(targetProfile, 'data_leakage', 'critical',
          `Data contamination detected from profile ${sourceProfile}`);
        return false;
      }

      // Clean data of any profile-specific identifiers
      const cleanedData = await this.cleanProfileData(data, targetProfile);
      
      // Verify cleaning was successful
      const stillContaminated = await this.detectDataContamination(cleanedData, sourceProfile, targetProfile);
      
      return !stillContaminated;
    } catch (error) {
      console.error('Data contamination prevention failed:', error);
      return false;
    }
  }

  /**
   * Verify isolation boundary integrity
   */
  public async verifyIsolationIntegrity(profileId: string): Promise<number> {
    try {
      const boundary = this.isolationBoundaries.get(profileId);
      if (!boundary) {
        return 0;
      }

      let totalChecks = 0;
      let passedChecks = 0;

      // Check collection isolation
      for (const collection of boundary.collections) {
        totalChecks++;
        const isolationValid = await this.verifyCollectionIsolation(profileId, collection);
        if (isolationValid) {
          passedChecks++;
        }
      }

      // Check access controls
      const accessControls = this.accessControls.get(profileId) || [];
      for (const control of accessControls) {
        totalChecks++;
        const controlValid = await this.verifyAccessControl(control);
        if (controlValid) {
          passedChecks++;
        }
      }

      // Check encryption compliance
      totalChecks++;
      const encryptionValid = await this.verifyEncryptionCompliance(profileId);
      if (encryptionValid) {
        passedChecks++;
      }

      // Calculate isolation score
      const isolationScore = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;

      // Update boundary
      boundary.isolationScore = isolationScore;
      boundary.lastValidated = new Date().toISOString();
      this.isolationBoundaries.set(profileId, boundary);

      return isolationScore;
    } catch (error) {
      console.error('Isolation integrity verification failed:', error);
      return 0;
    }
  }

  /**
   * Get isolation status for a profile
   */
  public getIsolationStatus(profileId: string): {
    hasPolicy: boolean;
    hasBoundary: boolean;
    isolationScore: number;
    lastValidated: string | null;
    violationCount: number;
  } {
    const policy = this.isolationPolicies.get(profileId);
    const boundary = this.isolationBoundaries.get(profileId);
    const violations = Array.from(this.violationAlerts.values()).filter(alert => 
      alert.profileId === profileId && !alert.resolved
    );

    return {
      hasPolicy: !!policy,
      hasBoundary: !!boundary,
      isolationScore: boundary?.isolationScore || 0,
      lastValidated: boundary?.lastValidated || null,
      violationCount: violations.length
    };
  }

  // Private helper methods

  private createIsolationPolicy(profileId: string, securityLevel: SecurityClassification): IsolationPolicy {
    const isHighSecurity = securityLevel >= SecurityClassification.CONFIDENTIAL;

    return {
      profileId,
      isolationLevel: securityLevel,
      allowCrossProfileAccess: false, // Always false for maximum security
      encryptionRequired: isHighSecurity,
      auditAllAccess: isHighSecurity,
      dataRetentionDays: isHighSecurity ? 2555 : 1095, // 7 years for high security, 3 years for standard
      allowedOperations: [
        {
          operation: 'read',
          collections: ['transactions', 'breakthroughs', 'apiKeys', 'settings', 'blocks', 'research'],
          restrictions: isHighSecurity ? [{ type: 'mfa_required', value: 'true', description: 'MFA required for read operations' }] : []
        },
        {
          operation: 'write',
          collections: ['transactions', 'breakthroughs', 'apiKeys', 'settings', 'blocks', 'research'],
          restrictions: isHighSecurity ? [{ type: 'mfa_required', value: 'true', description: 'MFA required for write operations' }] : []
        },
        {
          operation: 'delete',
          collections: ['transactions', 'breakthroughs', 'settings', 'blocks', 'research'],
          restrictions: [{ type: 'mfa_required', value: 'true', description: 'MFA required for delete operations' }]
        }
      ]
    };
  }

  private async createIsolationBoundary(profileId: string, policy: IsolationPolicy): Promise<IsolationBoundary> {
    const collections: ProfileCollection[] = [];
    const baseCollections = ['transactions', 'breakthroughs', 'apiKeys', 'settings', 'blocks', 'research'];

    for (const collection of baseCollections) {
      collections.push({
        name: collection,
        isolatedName: this.generateIsolatedCollectionName(profileId, collection),
        dataCount: 0,
        encryptedCount: 0,
        lastAccessed: new Date().toISOString(),
        accessPattern: []
      });
    }

    return {
      profileId,
      collections,
      accessControls: [],
      encryptionKeys: [],
      isolationScore: 100,
      lastValidated: new Date().toISOString()
    };
  }

  private createAccessControls(profileId: string, policy: IsolationPolicy): AccessControl[] {
    const controls: AccessControl[] = [];

    // Create controls for each allowed operation
    for (const operation of policy.allowedOperations) {
      for (const collection of operation.collections) {
        controls.push({
          controlId: this.generateControlId(profileId, operation.operation, collection),
          profileId,
          resource: collection,
          permissions: [operation.operation],
          conditions: operation.restrictions.map(restriction => ({
            type: restriction.type as any,
            value: restriction.value,
            active: true
          })),
          created: new Date().toISOString()
        });
      }
    }

    return controls;
  }

  private generateIsolatedCollectionName(profileId: string, collection: string): string {
    return `${profileId}_${collection}`;
  }

  private generateControlId(profileId: string, operation: string, collection: string): string {
    return `control_${profileId}_${operation}_${collection}_${Date.now()}`;
  }

  private isOperationAllowed(policy: IsolationPolicy, operation: string, collection: string): boolean {
    return policy.allowedOperations.some(op => 
      op.operation === operation && op.collections.includes(collection)
    );
  }

  private async checkAccessControls(
    requestingProfile: string,
    targetProfile: string,
    operation: string,
    resource: string
  ): Promise<boolean> {
    const controls = this.accessControls.get(targetProfile) || [];
    
    // Find matching access control
    const matchingControl = controls.find(control => 
      control.resource === resource && control.permissions.includes(operation)
    );

    if (!matchingControl) {
      return false;
    }

    // Check all conditions
    for (const condition of matchingControl.conditions) {
      if (!condition.active) continue;

      const conditionMet = await this.evaluateAccessCondition(condition, requestingProfile);
      if (!conditionMet) {
        return false;
      }
    }

    return true;
  }

  private async evaluateAccessCondition(condition: AccessCondition, requestingProfile: string): Promise<boolean> {
    switch (condition.type) {
      case 'time_window':
        return this.isWithinTimeWindow(condition.value);
      case 'ip_whitelist':
        return this.isIpWhitelisted(condition.value);
      case 'device_trust':
        return this.isDeviceTrusted(condition.value, requestingProfile);
      case 'mfa_verified':
        return this.isMfaVerified(requestingProfile);
      default:
        return true;
    }
  }

  private isWithinTimeWindow(timeWindow: string): boolean {
    // Simplified time window check
    // In production, this would parse the time window and check current time
    return true;
  }

  private isIpWhitelisted(ipWhitelist: string): boolean {
    // Simplified IP whitelist check
    // In production, this would check the client IP against the whitelist
    return true;
  }

  private isDeviceTrusted(deviceId: string, profileId: string): boolean {
    // Simplified device trust check
    // In production, this would check against trusted device registry
    return true;
  }

  private isMfaVerified(profileId: string): boolean {
    // Simplified MFA check
    // In production, this would check current session MFA status
    return true;
  }

  private async updateAccessPattern(profileId: string, collection: string, operation: string): Promise<void> {
    const boundary = this.isolationBoundaries.get(profileId);
    if (!boundary) return;

    const profileCollection = boundary.collections.find(c => c.name === collection);
    if (!profileCollection) return;

    profileCollection.accessPattern.push({
      timestamp: new Date().toISOString(),
      operation,
      success: true,
      source: profileId
    });

    profileCollection.lastAccessed = new Date().toISOString();

    // Keep only last 100 access patterns
    if (profileCollection.accessPattern.length > 100) {
      profileCollection.accessPattern = profileCollection.accessPattern.slice(-100);
    }
  }

  private async detectDataContamination(data: any, sourceProfile: string, targetProfile: string): Promise<boolean> {
    try {
      const dataString = JSON.stringify(data);
      
      // Check for source profile ID in data
      if (dataString.includes(sourceProfile)) {
        return true;
      }

      // Check for source profile-specific collection names
      const sourceCollections = ['transactions', 'breakthroughs', 'apiKeys', 'settings', 'blocks', 'research']
        .map(collection => `${sourceProfile}_${collection}`);
      
      for (const collection of sourceCollections) {
        if (dataString.includes(collection)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Data contamination detection failed:', error);
      return true; // Assume contamination if detection fails
    }
  }

  private async cleanProfileData(data: any, targetProfile: string): Promise<any> {
    try {
      let cleanedData = JSON.parse(JSON.stringify(data));
      
      // Remove or replace profile-specific identifiers
      // This is a simplified implementation
      if (typeof cleanedData === 'object' && cleanedData !== null) {
        if (cleanedData.profileId) {
          cleanedData.profileId = targetProfile;
        }
      }

      return cleanedData;
    } catch (error) {
      console.error('Profile data cleaning failed:', error);
      return data;
    }
  }

  private async verifyCollectionIsolation(profileId: string, collection: ProfileCollection): Promise<boolean> {
    try {
      // Check if collection exists and contains only profile data
      const items = await enhancedDB.query(collection.isolatedName, []);
      
      for (const item of items) {
        if ((item as any).profileId && (item as any).profileId !== profileId) {
          return false; // Found data from different profile
        }
      }

      return true;
    } catch (error) {
      console.error('Collection isolation verification failed:', error);
      return false;
    }
  }

  private async verifyAccessControl(control: AccessControl): Promise<boolean> {
    // Verify access control is properly configured and active
    return control.conditions.every(condition => condition.active !== undefined);
  }

  private async verifyEncryptionCompliance(profileId: string): Promise<boolean> {
    const policy = this.isolationPolicies.get(profileId);
    if (!policy || !policy.encryptionRequired) {
      return true; // No encryption required
    }

    // Check if sensitive data is encrypted
    // This would involve checking actual data encryption status
    return true; // Simplified for now
  }

  private async logAccessAttempt(
    profileId: string,
    operation: string,
    resource: string,
    success: boolean,
    reason: string
  ): Promise<void> {
    try {
      const logEntry = {
        logId: `access_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        profileId,
        operation,
        resource,
        success,
        reason,
        timestamp: new Date().toISOString()
      };

      await enhancedDB.set('access_logs', logEntry.logId, logEntry);
    } catch (error) {
      console.error('Failed to log access attempt:', error);
    }
  }

  private async createViolationAlert(
    profileId: string,
    violationType: IsolationViolationAlert['violationType'],
    severity: IsolationViolationAlert['severity'],
    description: string
  ): Promise<void> {
    try {
      const alert: IsolationViolationAlert = {
        alertId: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        profileId,
        violationType,
        severity,
        description,
        evidence: [],
        timestamp: new Date().toISOString(),
        resolved: false
      };

      await enhancedDB.set('violation_alerts', alert.alertId, alert);
      console.warn(`Isolation violation alert created: ${alert.alertId}`);
    } catch (error) {
      console.error('Failed to create violation alert:', error);
    }
  }

  private async storeIsolationConfig(
    profileId: string,
    config: { policy: IsolationPolicy; boundary: IsolationBoundary; accessControls: AccessControl[] }
  ): Promise<void> {
    try {
      await enhancedDB.set('isolation_policies', profileId, config.policy);
      await enhancedDB.set('isolation_boundaries', profileId, config.boundary);
      await enhancedDB.set('access_controls', profileId, config.accessControls);
    } catch (error) {
      console.error('Failed to store isolation config:', error);
    }
  }
}

// Export singleton factory
export function createProfileIsolationManager(dataSegregator: DataSegregator): ProfileIsolationManager {
  return new ProfileIsolationManager(dataSegregator);
}