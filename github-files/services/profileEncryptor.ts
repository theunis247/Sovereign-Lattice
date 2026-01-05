/**
 * Profile Encryptor Service
 * Advanced encryption system with profile-specific keys and multi-layer security
 */

import { EncryptionService } from './encryption';
import { SecurityClassification } from './profileManager';
import { DataSensitivity } from './dataSegregator';

export interface ProfileKeySet {
  masterKey: CryptoKey;
  dataKeys: Map<string, CryptoKey>; // Different keys for different data types
  syncKey: CryptoKey;
  backupKey: CryptoKey;
  auditKey: CryptoKey;
}

export interface ProfileEncryptedData {
  encryptedData: string;
  keyId: string;
  profileId: string;
  algorithm: string;
  iv: string;
  salt: string;
  integrity: string;
  layers: string[]; // Track encryption layers applied
}

export interface MultiKeyEncryptedData {
  encryptedData: string;
  keyIds: string[];
  profileId: string;
  algorithm: string;
  metadata: {
    layers: number;
    created: string;
    integrity: string;
  };
}

export interface SecureVault {
  vaultId: string;
  profileId: string;
  encryptionLevel: SecurityClassification;
  keyRotationInterval: number;
  created: string;
  lastAccessed: string;
}

/**
 * Profile Encryptor Service
 * Provides profile-specific encryption with multiple security layers
 */
export class ProfileEncryptor {
  private profileKeys: Map<string, ProfileKeySet> = new Map();
  private keyDerivationCache: Map<string, CryptoKey> = new Map();
  private vaults: Map<string, SecureVault> = new Map();

  /**
   * Encrypt data for a specific profile with sensitivity-based layering
   */
  public async encryptForProfile<T>(
    profileId: string,
    data: T,
    sensitivity: DataSensitivity = DataSensitivity.INTERNAL
  ): Promise<ProfileEncryptedData> {
    try {
      // Get or generate profile keys
      const keySet = await this.getOrGenerateProfileKeys(profileId);
      
      // Determine encryption strategy based on sensitivity
      const encryptionLayers = this.determineEncryptionLayers(sensitivity);
      
      // Apply layered encryption
      let encryptedData = JSON.stringify(data);
      const appliedLayers: string[] = [];
      
      for (const layer of encryptionLayers) {
        const key = await this.selectKeyForLayer(keySet, layer);
        const layerResult = await this.applyEncryptionLayer(encryptedData, key, layer);
        encryptedData = layerResult.encryptedData;
        appliedLayers.push(layer);
      }

      // Generate integrity hash
      const integrity = await this.calculateIntegrityHash(encryptedData, profileId);

      // Create encrypted data structure
      const result: ProfileEncryptedData = {
        encryptedData,
        keyId: this.generateKeyId(profileId, sensitivity),
        profileId,
        algorithm: 'AES-GCM-LAYERED',
        iv: this.generateIV(),
        salt: this.generateSalt(),
        integrity,
        layers: appliedLayers
      };

      return result;
    } catch (error) {
      console.error('Profile encryption failed:', error);
      throw new Error(`Profile encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data for a specific profile
   */
  public async decryptForProfile<T>(
    profileId: string,
    encryptedData: ProfileEncryptedData
  ): Promise<T> {
    try {
      // Verify profile ownership
      if (encryptedData.profileId !== profileId) {
        throw new Error('Profile mismatch - unauthorized decryption attempt');
      }

      // Verify data integrity
      const integrityValid = await this.verifyIntegrity(encryptedData);
      if (!integrityValid) {
        throw new Error('Data integrity verification failed');
      }

      // Get profile keys
      const keySet = await this.getOrGenerateProfileKeys(profileId);
      
      // Reverse the encryption layers
      let decryptedData = encryptedData.encryptedData;
      const reversedLayers = [...encryptedData.layers].reverse();
      
      for (const layer of reversedLayers) {
        const key = await this.selectKeyForLayer(keySet, layer);
        decryptedData = await this.removeEncryptionLayer(decryptedData, key, layer);
      }

      // Parse and return the original data
      return JSON.parse(decryptedData) as T;
    } catch (error) {
      console.error('Profile decryption failed:', error);
      throw new Error(`Profile decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate profile-specific key set
   */
  public async generateProfileKeys(profileId: string, seed: string): Promise<ProfileKeySet> {
    try {
      // Derive master key from profile seed
      const masterKey = await this.deriveKeyFromSeed(seed, 'master', profileId);
      
      // Generate specialized keys
      const dataKeys = new Map<string, CryptoKey>();
      const dataTypes = ['transactions', 'breakthroughs', 'apiKeys', 'settings', 'blocks', 'research'];
      
      for (const dataType of dataTypes) {
        const key = await this.deriveKeyFromSeed(seed, dataType, profileId);
        dataKeys.set(dataType, key);
      }

      // Generate operational keys
      const syncKey = await this.deriveKeyFromSeed(seed, 'sync', profileId);
      const backupKey = await this.deriveKeyFromSeed(seed, 'backup', profileId);
      const auditKey = await this.deriveKeyFromSeed(seed, 'audit', profileId);

      const keySet: ProfileKeySet = {
        masterKey,
        dataKeys,
        syncKey,
        backupKey,
        auditKey
      };

      // Cache the key set
      this.profileKeys.set(profileId, keySet);

      return keySet;
    } catch (error) {
      console.error('Profile key generation failed:', error);
      throw new Error(`Profile key generation failed: ${error.message}`);
    }
  }

  /**
   * Rotate profile keys
   */
  public async rotateProfileKeys(profileId: string): Promise<ProfileKeySet> {
    try {
      // Generate new seed for key rotation
      const newSeed = EncryptionService.generateSecurePassword();
      
      // Generate new key set
      const newKeySet = await this.generateProfileKeys(profileId, newSeed);
      
      // Clear old keys from cache
      this.clearProfileKeysFromCache(profileId);
      
      return newKeySet;
    } catch (error) {
      console.error('Profile key rotation failed:', error);
      throw new Error(`Profile key rotation failed: ${error.message}`);
    }
  }

  /**
   * Derive data-specific key
   */
  public async deriveDataKey(profileId: string, dataType: string): Promise<CryptoKey> {
    const cacheKey = `${profileId}:${dataType}`;
    
    // Check cache first
    if (this.keyDerivationCache.has(cacheKey)) {
      return this.keyDerivationCache.get(cacheKey)!;
    }

    try {
      // Get profile keys
      const keySet = await this.getOrGenerateProfileKeys(profileId);
      
      // Get data-specific key or use master key
      const dataKey = keySet.dataKeys.get(dataType) || keySet.masterKey;
      
      // Cache the key
      this.keyDerivationCache.set(cacheKey, dataKey);
      
      return dataKey;
    } catch (error) {
      console.error('Data key derivation failed:', error);
      throw new Error(`Data key derivation failed: ${error.message}`);
    }
  }

  /**
   * Encrypt with multiple keys for enhanced security
   */
  public async encryptWithMultipleKeys<T>(
    data: T,
    keyIds: string[]
  ): Promise<MultiKeyEncryptedData> {
    try {
      let encryptedData = JSON.stringify(data);
      const usedKeyIds: string[] = [];

      // Apply encryption with each key
      for (const keyId of keyIds) {
        const key = await this.getKeyById(keyId);
        if (key) {
          const layerResult = await this.applyEncryptionLayer(encryptedData, key, 'multi-key');
          encryptedData = layerResult.encryptedData;
          usedKeyIds.push(keyId);
        }
      }

      // Calculate integrity hash
      const integrity = await this.calculateIntegrityHash(encryptedData, usedKeyIds.join(':'));

      return {
        encryptedData,
        keyIds: usedKeyIds,
        profileId: this.extractProfileIdFromKeyId(keyIds[0]),
        algorithm: 'AES-GCM-MULTI-KEY',
        metadata: {
          layers: usedKeyIds.length,
          created: new Date().toISOString(),
          integrity
        }
      };
    } catch (error) {
      console.error('Multi-key encryption failed:', error);
      throw new Error(`Multi-key encryption failed: ${error.message}`);
    }
  }

  /**
   * Create secure vault for profile
   */
  public async createSecureVault(profileId: string): Promise<SecureVault> {
    try {
      const vaultId = this.generateVaultId(profileId);
      
      const vault: SecureVault = {
        vaultId,
        profileId,
        encryptionLevel: SecurityClassification.SECRET,
        keyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
        created: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };

      // Store vault
      this.vaults.set(vaultId, vault);

      return vault;
    } catch (error) {
      console.error('Secure vault creation failed:', error);
      throw new Error(`Secure vault creation failed: ${error.message}`);
    }
  }

  // Private helper methods

  private async getOrGenerateProfileKeys(profileId: string): Promise<ProfileKeySet> {
    // Check cache first
    if (this.profileKeys.has(profileId)) {
      return this.profileKeys.get(profileId)!;
    }

    // Generate new keys with default seed
    const defaultSeed = await this.generateDefaultSeed(profileId);
    return await this.generateProfileKeys(profileId, defaultSeed);
  }

  private async generateDefaultSeed(profileId: string): Promise<string> {
    // Generate a deterministic but secure seed based on profile ID
    const seedData = `${profileId}:${Date.now()}:${EncryptionService.generateSecurePassword()}`;
    return await EncryptionService.hash(seedData);
  }

  private async deriveKeyFromSeed(seed: string, purpose: string, profileId: string): Promise<CryptoKey> {
    try {
      // Create key material from seed
      const encoder = new TextEncoder();
      const seedData = encoder.encode(`${seed}:${purpose}:${profileId}`);
      
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        seedData,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      // Generate salt for key derivation
      const salt = encoder.encode(`${profileId}:${purpose}`);

      // Derive the actual key
      return await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Key derivation failed:', error);
      throw new Error(`Key derivation failed: ${error.message}`);
    }
  }

  private determineEncryptionLayers(sensitivity: DataSensitivity): string[] {
    const layers: string[] = ['base'];

    if (sensitivity >= DataSensitivity.CONFIDENTIAL) {
      layers.push('confidential');
    }

    if (sensitivity >= DataSensitivity.SECRET) {
      layers.push('secret');
    }

    if (sensitivity >= DataSensitivity.TOP_SECRET) {
      layers.push('top-secret');
    }

    return layers;
  }

  private async selectKeyForLayer(keySet: ProfileKeySet, layer: string): Promise<CryptoKey> {
    switch (layer) {
      case 'base':
        return keySet.masterKey;
      case 'confidential':
        return keySet.dataKeys.get('confidential') || keySet.masterKey;
      case 'secret':
        return keySet.dataKeys.get('secret') || keySet.masterKey;
      case 'top-secret':
        return keySet.dataKeys.get('top-secret') || keySet.masterKey;
      case 'sync':
        return keySet.syncKey;
      case 'backup':
        return keySet.backupKey;
      case 'audit':
        return keySet.auditKey;
      default:
        return keySet.masterKey;
    }
  }

  private async applyEncryptionLayer(
    data: string,
    key: CryptoKey,
    layer: string
  ): Promise<{ encryptedData: string; iv: string }> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate IV for this layer
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      return {
        encryptedData: btoa(String.fromCharCode(...combined)),
        iv: btoa(String.fromCharCode(...iv))
      };
    } catch (error) {
      console.error('Encryption layer application failed:', error);
      throw new Error(`Encryption layer application failed: ${error.message}`);
    }
  }

  private async removeEncryptionLayer(
    encryptedData: string,
    key: CryptoKey,
    layer: string
  ): Promise<string> {
    try {
      // Decode the encrypted data
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encrypted
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Encryption layer removal failed:', error);
      throw new Error(`Encryption layer removal failed: ${error.message}`);
    }
  }

  private generateKeyId(profileId: string, sensitivity: DataSensitivity): string {
    return `${profileId}:${sensitivity}:${Date.now()}`;
  }

  private generateVaultId(profileId: string): string {
    return `vault_${profileId}_${Date.now()}`;
  }

  private generateIV(): string {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    return btoa(String.fromCharCode(...iv));
  }

  private generateSalt(): string {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return btoa(String.fromCharCode(...salt));
  }

  private async calculateIntegrityHash(data: string, context: string): Promise<string> {
    const hashData = `${data}:${context}`;
    return await EncryptionService.hash(hashData);
  }

  private async verifyIntegrity(encryptedData: ProfileEncryptedData): Promise<boolean> {
    try {
      const expectedHash = await this.calculateIntegrityHash(
        encryptedData.encryptedData,
        encryptedData.profileId
      );
      return expectedHash === encryptedData.integrity;
    } catch (error) {
      console.error('Integrity verification failed:', error);
      return false;
    }
  }

  private async getKeyById(keyId: string): Promise<CryptoKey | null> {
    // Extract profile ID from key ID
    const profileId = this.extractProfileIdFromKeyId(keyId);
    
    if (!profileId) {
      return null;
    }

    // Get profile keys and find the specific key
    const keySet = await this.getOrGenerateProfileKeys(profileId);
    
    // This is a simplified implementation
    // In production, you'd have a more sophisticated key lookup
    return keySet.masterKey;
  }

  private extractProfileIdFromKeyId(keyId: string): string {
    const parts = keyId.split(':');
    return parts.length > 0 ? parts[0] : '';
  }

  private clearProfileKeysFromCache(profileId: string): void {
    this.profileKeys.delete(profileId);
    
    // Clear related keys from derivation cache
    const keysToDelete: string[] = [];
    for (const [key] of this.keyDerivationCache) {
      if (key.startsWith(`${profileId}:`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.keyDerivationCache.delete(key));
  }

  /**
   * Get encryption statistics
   */
  public getEncryptionStats(): {
    profileKeysCount: number;
    cachedKeysCount: number;
    vaultsCount: number;
  } {
    return {
      profileKeysCount: this.profileKeys.size,
      cachedKeysCount: this.keyDerivationCache.size,
      vaultsCount: this.vaults.size
    };
  }

  /**
   * Clear all cached keys (for security)
   */
  public clearAllKeys(): void {
    this.profileKeys.clear();
    this.keyDerivationCache.clear();
  }
}

// Export singleton factory
export function createProfileEncryptor(): ProfileEncryptor {
  return new ProfileEncryptor();
}