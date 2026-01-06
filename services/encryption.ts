/**
 * Secure Encryption Service for API Key Management
 * Uses Web Crypto API with comprehensive fallback mechanisms for unsupported browsers
 */

import { CryptoFallbackService } from './cryptoFallback';

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  salt: string;
  method?: 'webcrypto' | 'fallback';
}

export class EncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly SALT_LENGTH = 16;
  private static readonly ITERATIONS = 100000;

  /**
   * Generate a random salt for key derivation
   */
  private static generateSalt(): Uint8Array {
    const result = CryptoFallbackService.generateRandomBytes(this.SALT_LENGTH);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('Failed to generate salt');
  }

  /**
   * Generate a random initialization vector
   */
  private static generateIV(): Uint8Array {
    const result = CryptoFallbackService.generateRandomBytes(this.IV_LENGTH);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('Failed to generate IV');
  }

  /**
   * Check if Web Crypto API is fully supported
   */
  private static isWebCryptoSupported(): boolean {
    const support = CryptoFallbackService.getSupportInfo();
    return support.supportLevel === 'full';
  }

  /**
   * Derive encryption key from password and salt using PBKDF2
   */
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Derive actual encryption key
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(salt), // Ensure proper type
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data using AES-GCM or fallback method
   */
  public static async encrypt(data: string, password: string): Promise<EncryptedData> {
    // Try Web Crypto API first
    if (this.isWebCryptoSupported()) {
      try {
        return await this.encryptWithWebCrypto(data, password);
      } catch (error) {
        console.warn('Web Crypto API encryption failed, falling back to alternative method:', error.message);
        // Fall through to fallback method
      }
    }

    // Use fallback encryption method
    return await this.encryptWithFallback(data, password);
  }

  /**
   * Encrypt using Web Crypto API
   */
  private static async encryptWithWebCrypto(data: string, password: string): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate salt and IV
    const salt = this.generateSalt();
    const iv = this.generateIV();

    // Derive encryption key
    const key = await this.deriveKey(password, salt);

    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: new Uint8Array(iv) // Ensure proper type
      },
      key,
      dataBuffer
    );

    // Convert to base64 for storage
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const encryptedData = btoa(String.fromCharCode(...encryptedArray));
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const saltBase64 = btoa(String.fromCharCode(...salt));

    return {
      encryptedData,
      iv: ivBase64,
      salt: saltBase64,
      method: 'webcrypto'
    };
  }

  /**
   * Encrypt using fallback method
   */
  private static async encryptWithFallback(data: string, password: string): Promise<EncryptedData> {
    // Generate salt and IV using fallback
    const saltResult = CryptoFallbackService.generateRandomBytes(this.SALT_LENGTH);
    const ivResult = CryptoFallbackService.generateRandomBytes(this.IV_LENGTH);

    if (!saltResult.success || !ivResult.success) {
      throw new Error('Failed to generate cryptographic parameters');
    }

    // Convert salt and IV to strings for key derivation
    const saltString = btoa(String.fromCharCode(...saltResult.data!));
    const ivString = btoa(String.fromCharCode(...ivResult.data!));

    // Derive key using fallback method
    const keyResult = await CryptoFallbackService.deriveKey(password, saltString, this.ITERATIONS);
    
    if (!keyResult.success || !keyResult.data) {
      throw new Error('Failed to derive encryption key');
    }

    // Encrypt using simple XOR method
    const encryptResult = CryptoFallbackService.simpleEncrypt(data, keyResult.data);
    
    if (!encryptResult.success || !encryptResult.data) {
      throw new Error('Failed to encrypt data');
    }

    return {
      encryptedData: encryptResult.data,
      iv: ivString,
      salt: saltString,
      method: 'fallback'
    };
  }

  /**
   * Decrypt data using AES-GCM or fallback method
   */
  public static async decrypt(encryptedData: EncryptedData, password: string): Promise<string> {
    // Check which method was used for encryption
    const method = encryptedData.method || 'webcrypto'; // Default to webcrypto for backward compatibility

    if (method === 'webcrypto' && this.isWebCryptoSupported()) {
      try {
        return await this.decryptWithWebCrypto(encryptedData, password);
      } catch (error) {
        console.warn('Web Crypto API decryption failed, trying fallback method:', error.message);
        // Try fallback method as last resort
        return await this.decryptWithFallback(encryptedData, password);
      }
    }

    // Use fallback decryption method
    return await this.decryptWithFallback(encryptedData, password);
  }

  /**
   * Decrypt using Web Crypto API
   */
  private static async decryptWithWebCrypto(encryptedData: EncryptedData, password: string): Promise<string> {
    // Convert from base64
    const encryptedArray = new Uint8Array(
      atob(encryptedData.encryptedData).split('').map(char => char.charCodeAt(0))
    );
    const iv = new Uint8Array(
      atob(encryptedData.iv).split('').map(char => char.charCodeAt(0))
    );
    const salt = new Uint8Array(
      atob(encryptedData.salt).split('').map(char => char.charCodeAt(0))
    );

    // Derive decryption key
    const key = await this.deriveKey(password, salt);

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      encryptedArray
    );

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Decrypt using fallback method
   */
  private static async decryptWithFallback(encryptedData: EncryptedData, password: string): Promise<string> {
    // Derive key using fallback method
    const keyResult = await CryptoFallbackService.deriveKey(password, encryptedData.salt, this.ITERATIONS);
    
    if (!keyResult.success || !keyResult.data) {
      throw new Error('Failed to derive decryption key');
    }

    // Decrypt using simple XOR method
    const decryptResult = CryptoFallbackService.simpleDecrypt(encryptedData.encryptedData, keyResult.data);
    
    if (!decryptResult.success || !decryptResult.data) {
      throw new Error('Failed to decrypt data');
    }

    return decryptResult.data;
  }

  /**
   * Generate a secure random password for key derivation
   */
  public static generateSecurePassword(): string {
    const result = CryptoFallbackService.generateSecurePassword(32);
    
    if (result.success && result.data) {
      return result.data;
    }
    
    // Final fallback
    const array = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Hash a string using SHA-256 or fallback method
   */
  public static async hash(data: string): Promise<string> {
    const result = await CryptoFallbackService.hashData(data);
    
    if (result.success && result.data) {
      return result.data;
    }
    
    throw new Error('Failed to hash data');
  }

  /**
   * Verify if Web Crypto API is available and functional
   */
  public static isSupported(): boolean {
    return this.isWebCryptoSupported();
  }

  /**
   * Get detailed crypto support information
   */
  public static getCryptoSupport(): {
    webCrypto: boolean;
    getRandomValues: boolean;
    subtle: boolean;
    fallbackAvailable: boolean;
    supportLevel: string;
  } {
    const support = CryptoFallbackService.getSupportInfo();
    
    return {
      webCrypto: support.webCrypto,
      getRandomValues: support.getRandomValues,
      subtle: support.subtle,
      fallbackAvailable: support.fallbackAvailable,
      supportLevel: support.supportLevel
    };
  }

  /**
   * Test crypto functionality and return detailed report
   */
  public static async testCryptoFunctionality(): Promise<any> {
    return await CryptoFallbackService.testCryptoFunctionality();
  }
}

/**
 * Secure Storage Service for encrypted data
 */
export class SecureStorage {
  private static readonly STORAGE_PREFIX = 'QBS_SECURE_';

  /**
   * Store encrypted data in localStorage
   */
  public static store(key: string, encryptedData: EncryptedData): void {
    try {
      const storageKey = this.STORAGE_PREFIX + key;
      const dataToStore = JSON.stringify(encryptedData);
      localStorage.setItem(storageKey, dataToStore);
    } catch (error) {
      throw new Error(`Failed to store encrypted data: ${error.message}`);
    }
  }

  /**
   * Retrieve encrypted data from localStorage
   */
  public static retrieve(key: string): EncryptedData | null {
    try {
      const storageKey = this.STORAGE_PREFIX + key;
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) {
        return null;
      }

      return JSON.parse(storedData) as EncryptedData;
    } catch (error) {
      console.error(`Failed to retrieve encrypted data: ${error.message}`);
      return null;
    }
  }

  /**
   * Remove encrypted data from localStorage
   */
  public static remove(key: string): void {
    try {
      const storageKey = this.STORAGE_PREFIX + key;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Failed to remove encrypted data: ${error.message}`);
    }
  }

  /**
   * Check if encrypted data exists
   */
  public static exists(key: string): boolean {
    const storageKey = this.STORAGE_PREFIX + key;
    return localStorage.getItem(storageKey) !== null;
  }

  /**
   * Clear all secure storage data
   */
  public static clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error(`Failed to clear secure storage: ${error.message}`);
    }
  }

  /**
   * Get all secure storage keys
   */
  public static getAllKeys(): string[] {
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(this.STORAGE_PREFIX))
        .map(key => key.replace(this.STORAGE_PREFIX, ''));
    } catch (error) {
      console.error(`Failed to get storage keys: ${error.message}`);
      return [];
    }
  }
}