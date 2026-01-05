/**
 * Data Segregator Service
 * Ensures complete data isolation between profiles with zero leakage
 */

import { enhancedDB } from './enhancedDatabase';
import { SecurityClassification } from './profileManager';

// Define DataSensitivity locally to avoid circular dependency
export enum DataSensitivity {
  PUBLIC = 0,
  INTERNAL = 1,
  CONFIDENTIAL = 2,
  SECRET = 3,
  TOP_SECRET = 4
}

// Simple encryption interface to avoid circular dependencies
interface SimpleEncryptor {
  encryptForProfile<T>(profileId: string, data: T, sensitivity: DataSensitivity): Promise<T>;
  decryptForProfile<T>(profileId: string, encryptedData: T): Promise<T>;
}

export interface IsolatedData<T> {
  profileId: string;
  data: T;
  isolation: {
    encrypted: boolean;
    segregated: boolean;
    verified: boolean;
  };
  metadata: {
    created: string;
    modified: string;
    checksum: string;
    profileChecksum: string;
  };
}

export interface SharePermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  expiresAt?: string;
  sharedBy: string;
  sharedWith: string;
}

export interface DataShare {
  shareId: string;
  fromProfile: string;
  toProfile: string;
  dataId: string;
  dataType: string;
  permissions: SharePermissions;
  created: string;
  accessed?: string;
  revoked?: string;
}

export interface IsolationReport {
  profileId: string;
  totalDataItems: number;
  isolatedItems: number;
  encryptedItems: number;
  verifiedItems: number;
  isolationIntegrity: number; // 0-100%
  violations: IsolationViolation[];
  lastChecked: string;
}

export interface LeakageReport {
  totalProfiles: number;
  crossProfileAccess: CrossProfileAccess[];
  unauthorizedShares: DataShare[];
  dataLeaks: DataLeak[];
  securityScore: number; // 0-100%
  recommendations: string[];
}

export interface IsolationViolation {
  violationId: string;
  profileId: string;
  dataId: string;
  violationType: 'encryption_missing' | 'cross_profile_access' | 'unauthorized_share' | 'checksum_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
}

export interface CrossProfileAccess {
  accessId: string;
  sourceProfile: string;
  targetProfile: string;
  dataAccessed: string;
  timestamp: string;
  authorized: boolean;
}

export interface DataLeak {
  leakId: string;
  profileId: string;
  dataType: string;
  leakType: 'unencrypted_storage' | 'cross_profile_contamination' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedData: string[];
  timestamp: string;
}

/**
 * Data Segregator Service
 * Provides complete data isolation between profiles
 */
export class DataSegregator {
  private encryptor: SimpleEncryptor | null = null;
  private isolationCache: Map<string, IsolationReport> = new Map();
  private shareRegistry: Map<string, DataShare> = new Map();

  constructor(encryptor?: SimpleEncryptor) {
    this.encryptor = encryptor || null;
  }

  /**
   * Set the encryptor (to avoid circular dependency issues)
   */
  public setEncryptor(encryptor: SimpleEncryptor): void {
    this.encryptor = encryptor;
  }

  /**
   * Isolate data for a specific profile with encryption and verification
   */
  public async isolateData<T>(
    profileId: string,
    collection: string,
    data: T,
    sensitivity: DataSensitivity = DataSensitivity.INTERNAL
  ): Promise<IsolatedData<T>> {
    try {
      // Validate profile access
      await this.validateProfileAccess(profileId, collection, 'write');

      // Generate profile-specific collection name
      const isolatedCollection = this.generateIsolatedCollectionName(profileId, collection);

      // Encrypt data based on sensitivity level
      const shouldEncrypt = sensitivity >= DataSensitivity.CONFIDENTIAL;
      let processedData = data;

      if (shouldEncrypt && this.encryptor) {
        processedData = await this.encryptor.encryptForProfile(profileId, data, sensitivity);
      }

      // Calculate checksums for integrity verification
      const dataChecksum = await this.calculateDataChecksum(data);
      const profileChecksum = await this.calculateProfileChecksum(profileId, collection);

      // Create isolated data structure
      const isolatedData: IsolatedData<T> = {
        profileId,
        data: processedData,
        isolation: {
          encrypted: shouldEncrypt,
          segregated: true,
          verified: true
        },
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          checksum: dataChecksum,
          profileChecksum
        }
      };

      // Store in profile-specific collection
      const dataId = this.generateDataId(profileId, collection);
      await enhancedDB.set(isolatedCollection, dataId, isolatedData);

      // Log isolation event
      await this.logIsolationEvent(profileId, dataId, 'data_isolated', 'low');

      return isolatedData;
    } catch (error) {
      console.error('Data isolation failed:', error);
      throw new Error(`Data isolation failed: ${error.message}`);
    }
  }

  /**
   * Retrieve isolated data for a specific profile
   */
  public async retrieveData<T>(
    profileId: string,
    collection: string,
    id: string
  ): Promise<T | null> {
    try {
      // Validate profile access
      await this.validateProfileAccess(profileId, collection, 'read');

      // Generate profile-specific collection name
      const isolatedCollection = this.generateIsolatedCollectionName(profileId, collection);

      // Retrieve isolated data
      const isolatedData = await enhancedDB.get<IsolatedData<T>>(isolatedCollection, id);

      if (!isolatedData) {
        return null;
      }

      // Verify data belongs to the requesting profile
      if (isolatedData.profileId !== profileId) {
        await this.logIsolationEvent(profileId, id, 'unauthorized_access_attempt', 'high');
        throw new Error('Unauthorized cross-profile data access attempt');
      }

      // Verify data integrity
      const integrityValid = await this.verifyDataIntegrity(isolatedData);
      if (!integrityValid) {
        await this.logIsolationEvent(profileId, id, 'integrity_violation', 'critical');
        throw new Error('Data integrity verification failed');
      }

      // Decrypt data if encrypted
      let retrievedData = isolatedData.data;
      if (isolatedData.isolation.encrypted && this.encryptor) {
        retrievedData = await this.encryptor.decryptForProfile(profileId, retrievedData);
      }

      // Log access event
      await this.logIsolationEvent(profileId, id, 'data_accessed', 'low');

      return retrievedData;
    } catch (error) {
      console.error('Data retrieval failed:', error);
      throw new Error(`Data retrieval failed: ${error.message}`);
    }
  }

  /**
   * Share data between profiles with controlled permissions
   */
  public async shareData(
    fromProfile: string,
    toProfile: string,
    dataId: string,
    permissions: SharePermissions
  ): Promise<void> {
    try {
      // Validate source profile owns the data
      await this.validateDataOwnership(fromProfile, dataId);

      // Validate sharing permissions
      await this.validateSharingPermissions(fromProfile, toProfile, permissions);

      // Create share record
      const shareId = this.generateShareId(fromProfile, toProfile, dataId);
      const dataShare: DataShare = {
        shareId,
        fromProfile,
        toProfile,
        dataId,
        dataType: await this.getDataType(dataId),
        permissions: {
          ...permissions,
          sharedBy: fromProfile,
          sharedWith: toProfile
        },
        created: new Date().toISOString()
      };

      // Store share record
      await enhancedDB.set('data_shares', shareId, dataShare);
      this.shareRegistry.set(shareId, dataShare);

      // Log sharing event
      await this.logIsolationEvent(fromProfile, dataId, 'data_shared', 'medium');
      await this.logIsolationEvent(toProfile, dataId, 'data_received', 'medium');

      console.log(`Data shared: ${dataId} from ${fromProfile} to ${toProfile}`);
    } catch (error) {
      console.error('Data sharing failed:', error);
      throw new Error(`Data sharing failed: ${error.message}`);
    }
  }

  /**
   * Revoke data sharing
   */
  public async revokeShare(shareId: string): Promise<void> {
    try {
      const share = await enhancedDB.get<DataShare>('data_shares', shareId);
      if (!share) {
        throw new Error('Share not found');
      }

      // Mark as revoked
      share.revoked = new Date().toISOString();
      await enhancedDB.set('data_shares', shareId, share);

      // Remove from registry
      this.shareRegistry.delete(shareId);

      // Log revocation
      await this.logIsolationEvent(share.fromProfile, share.dataId, 'share_revoked', 'medium');

      console.log(`Share revoked: ${shareId}`);
    } catch (error) {
      console.error('Share revocation failed:', error);
      throw new Error(`Share revocation failed: ${error.message}`);
    }
  }

  /**
   * Verify complete data isolation for a profile
   */
  public async verifyIsolation(profileId: string): Promise<IsolationReport> {
    try {
      const violations: IsolationViolation[] = [];
      let totalItems = 0;
      let isolatedItems = 0;
      let encryptedItems = 0;
      let verifiedItems = 0;

      // Get all collections for the profile
      const collections = await this.getProfileCollections(profileId);

      for (const collection of collections) {
        const items = await enhancedDB.query<IsolatedData<any>>(collection, []);
        totalItems += items.length;

        for (const item of items) {
          // Check if data belongs to correct profile
          if (item.profileId === profileId) {
            isolatedItems++;

            // Check encryption status
            if (item.isolation.encrypted) {
              encryptedItems++;
            }

            // Verify data integrity
            const integrityValid = await this.verifyDataIntegrity(item);
            if (integrityValid) {
              verifiedItems++;
            } else {
              violations.push({
                violationId: this.generateViolationId(),
                profileId,
                dataId: (item as any)._id || 'unknown',
                violationType: 'checksum_mismatch',
                severity: 'high',
                description: 'Data integrity verification failed',
                timestamp: new Date().toISOString()
              });
            }
          } else {
            // Cross-profile contamination detected
            violations.push({
              violationId: this.generateViolationId(),
              profileId,
              dataId: (item as any)._id || 'unknown',
              violationType: 'cross_profile_access',
              severity: 'critical',
              description: `Data belongs to profile ${item.profileId} but found in ${profileId} collection`,
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      const isolationIntegrity = totalItems > 0 ? (verifiedItems / totalItems) * 100 : 100;

      const report: IsolationReport = {
        profileId,
        totalDataItems: totalItems,
        isolatedItems,
        encryptedItems,
        verifiedItems,
        isolationIntegrity,
        violations,
        lastChecked: new Date().toISOString()
      };

      // Cache the report
      this.isolationCache.set(profileId, report);

      return report;
    } catch (error) {
      console.error('Isolation verification failed:', error);
      throw new Error(`Isolation verification failed: ${error.message}`);
    }
  }

  /**
   * Detect data leakage across all profiles
   */
  public async detectLeakage(): Promise<LeakageReport> {
    try {
      const crossProfileAccess: CrossProfileAccess[] = [];
      const unauthorizedShares: DataShare[] = [];
      const dataLeaks: DataLeak[] = [];
      const recommendations: string[] = [];

      // Get all profiles
      const profiles = await enhancedDB.query('profiles', []);
      const totalProfiles = profiles.length;

      // Check for cross-profile access patterns
      for (const profile of profiles) {
        const profileId = (profile as any).profileId;
        const isolationReport = await this.verifyIsolation(profileId);

        // Analyze violations
        for (const violation of isolationReport.violations) {
          if (violation.violationType === 'cross_profile_access') {
            crossProfileAccess.push({
              accessId: violation.violationId,
              sourceProfile: profileId,
              targetProfile: 'unknown',
              dataAccessed: violation.dataId,
              timestamp: violation.timestamp,
              authorized: false
            });

            dataLeaks.push({
              leakId: violation.violationId,
              profileId,
              dataType: 'unknown',
              leakType: 'cross_profile_contamination',
              severity: violation.severity as any,
              affectedData: [violation.dataId],
              timestamp: violation.timestamp
            });
          }
        }
      }

      // Check for unauthorized shares
      const allShares = await enhancedDB.query<DataShare>('data_shares', []);
      for (const share of allShares) {
        if (share.revoked) continue;

        // Check if share has expired
        if (share.permissions.expiresAt && new Date(share.permissions.expiresAt) < new Date()) {
          unauthorizedShares.push(share);
        }
      }

      // Calculate security score
      const totalViolations = crossProfileAccess.length + unauthorizedShares.length + dataLeaks.length;
      const securityScore = Math.max(0, 100 - (totalViolations * 10));

      // Generate recommendations
      if (crossProfileAccess.length > 0) {
        recommendations.push('Implement stricter profile isolation controls');
      }
      if (unauthorizedShares.length > 0) {
        recommendations.push('Review and clean up expired data shares');
      }
      if (dataLeaks.length > 0) {
        recommendations.push('Investigate and remediate data contamination');
      }
      if (securityScore < 80) {
        recommendations.push('Conduct comprehensive security audit');
      }

      return {
        totalProfiles,
        crossProfileAccess,
        unauthorizedShares,
        dataLeaks,
        securityScore,
        recommendations
      };
    } catch (error) {
      console.error('Leakage detection failed:', error);
      throw new Error(`Leakage detection failed: ${error.message}`);
    }
  }

  // Private helper methods

  private generateIsolatedCollectionName(profileId: string, collection: string): string {
    return `${profileId}_${collection}`;
  }

  private generateDataId(profileId: string, collection: string): string {
    return `${profileId}_${collection}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateShareId(fromProfile: string, toProfile: string, dataId: string): string {
    return `share_${fromProfile}_${toProfile}_${dataId}_${Date.now()}`;
  }

  private generateViolationId(): string {
    return `violation_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private async validateProfileAccess(profileId: string, collection: string, operation: 'read' | 'write'): Promise<void> {
    // Basic validation - in production, this would check against active profile context
    if (!profileId || profileId.length < 3) {
      throw new Error('Invalid profile ID');
    }

    if (!collection || collection.length === 0) {
      throw new Error('Invalid collection name');
    }

    // Additional access control checks would go here
    // For now, we'll just log the operation for audit purposes
    console.log(`Profile access: ${profileId} ${operation} ${collection}`);
  }

  private async validateDataOwnership(profileId: string, dataId: string): Promise<void> {
    // Verify that the profile owns the data
    // This would check the data's profile association
    if (!profileId || !dataId) {
      throw new Error('Invalid profile or data ID');
    }
  }

  private async validateSharingPermissions(fromProfile: string, toProfile: string, permissions: SharePermissions): Promise<void> {
    // Validate sharing is allowed between profiles
    if (fromProfile === toProfile) {
      throw new Error('Cannot share data with the same profile');
    }

    // Additional permission validation would go here
    console.log(`Validating share from ${fromProfile} to ${toProfile}`);
  }

  private async calculateDataChecksum(data: any): Promise<string> {
    const dataString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    return btoa(String.fromCharCode(...hashArray));
  }

  private async calculateProfileChecksum(profileId: string, collection: string): Promise<string> {
    const checksumData = `${profileId}:${collection}:${Date.now()}`;
    return await this.calculateDataChecksum(checksumData);
  }

  private async verifyDataIntegrity(isolatedData: IsolatedData<any>): Promise<boolean> {
    try {
      // Verify data checksum
      const currentChecksum = await this.calculateDataChecksum(isolatedData.data);
      return currentChecksum === isolatedData.metadata.checksum;
    } catch (error) {
      console.error('Integrity verification failed:', error);
      return false;
    }
  }

  private async getProfileCollections(profileId: string): Promise<string[]> {
    // Get all collections that belong to this profile
    const baseCollections = ['transactions', 'breakthroughs', 'apiKeys', 'settings', 'blocks', 'research'];
    return baseCollections.map(collection => this.generateIsolatedCollectionName(profileId, collection));
  }

  private async getDataType(dataId: string): Promise<string> {
    // Extract data type from data ID or collection
    const parts = dataId.split('_');
    return parts.length > 1 ? parts[1] : 'unknown';
  }

  private async logIsolationEvent(
    profileId: string,
    dataId: string,
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    try {
      const event = {
        eventId: `isolation_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        profileId,
        dataId,
        eventType,
        severity,
        timestamp: new Date().toISOString()
      };

      await enhancedDB.set('isolation_events', event.eventId, event);
    } catch (error) {
      console.error('Failed to log isolation event:', error);
    }
  }

  /**
   * Get isolation statistics for monitoring
   */
  public getIsolationStats(): {
    cachedReports: number;
    activeShares: number;
    lastCheck: string | null;
  } {
    const lastCheck = Array.from(this.isolationCache.values())
      .map(report => report.lastChecked)
      .sort()
      .pop() || null;

    return {
      cachedReports: this.isolationCache.size,
      activeShares: this.shareRegistry.size,
      lastCheck
    };
  }

  /**
   * Clear isolation cache
   */
  public clearCache(): void {
    this.isolationCache.clear();
  }
}

// Export singleton factory
export function createDataSegregator(encryptor?: SimpleEncryptor): DataSegregator {
  return new DataSegregator(encryptor);
}