/**
 * Secure Encryption Service for API Key Management
 * Uses Web Crypto API for client-side encryption
 */

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  salt: string;
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
    return crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
  }

  /**
   * Generate a random initialization vector
   */
  private static generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
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
        salt: salt,
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
   * Encrypt data using AES-GCM
   */
  public static async encrypt(data: string, password: string): Promise<EncryptedData> {
    try {
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
          iv: iv
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
        salt: saltBase64
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  public static async decrypt(encryptedData: EncryptedData, password: string): Promise<string> {
    try {
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
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate a secure random password for key derivation
   */
  public static generateSecurePassword(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Hash a string using SHA-256 (for verification purposes)
   */
  public static async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    return btoa(String.fromCharCode(...hashArray));
  }

  /**
   * Verify if Web Crypto API is available
   */
  public static isSupported(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.getRandomValues !== 'undefined';
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