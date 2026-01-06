/**
 * Crypto Fallback Service
 * Provides cryptographic operations with Web Crypto API detection and fallback mechanisms
 * Ensures secure operations work across all browsers and environments
 */

export interface CryptoSupport {
  webCrypto: boolean;
  getRandomValues: boolean;
  subtle: boolean;
  fallbackAvailable: boolean;
  supportLevel: 'full' | 'partial' | 'fallback';
}

export interface CryptoFallbackResult<T> {
  success: boolean;
  data?: T;
  method: 'webcrypto' | 'fallback' | 'basic';
  error?: string;
  warnings: string[];
}

/**
 * Comprehensive crypto fallback service
 */
export class CryptoFallbackService {
  private static _supportInfo: CryptoSupport | null = null;

  /**
   * Detect and cache crypto support information
   */
  public static getSupportInfo(): CryptoSupport {
    if (this._supportInfo) {
      return this._supportInfo;
    }

    const webCrypto = typeof crypto !== 'undefined';
    const getRandomValues = webCrypto && typeof crypto.getRandomValues !== 'undefined';
    const subtle = webCrypto && typeof crypto.subtle !== 'undefined';
    
    let supportLevel: 'full' | 'partial' | 'fallback' = 'fallback';
    if (webCrypto && getRandomValues && subtle) {
      supportLevel = 'full';
    } else if (webCrypto && getRandomValues) {
      supportLevel = 'partial';
    }

    this._supportInfo = {
      webCrypto,
      getRandomValues,
      subtle,
      fallbackAvailable: true,
      supportLevel
    };

    return this._supportInfo;
  }

  /**
   * Generate cryptographically secure random bytes with fallback
   */
  public static generateRandomBytes(length: number): CryptoFallbackResult<Uint8Array> {
    const warnings: string[] = [];
    
    try {
      // Try Web Crypto API first
      if (this.getSupportInfo().getRandomValues) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return {
          success: true,
          data: array,
          method: 'webcrypto',
          warnings
        };
      }
    } catch (error) {
      warnings.push(`Web Crypto API failed: ${error.message}`);
    }

    try {
      // Try Node.js crypto if available
      if (typeof require !== 'undefined') {
        const nodeCrypto = require('crypto');
        const bytes = nodeCrypto.randomBytes(length);
        const array = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
          array[i] = bytes[i];
        }
        return {
          success: true,
          data: array,
          method: 'fallback',
          warnings
        };
      }
    } catch (error) {
      warnings.push(`Node.js crypto failed: ${error.message}`);
    }

    // Enhanced Math.random fallback with multiple entropy sources
    warnings.push('Using Math.random fallback - reduced security');
    const array = new Uint8Array(length);
    const now = Date.now();
    const performance = typeof window !== 'undefined' && window.performance ? window.performance.now() : now;
    
    for (let i = 0; i < length; i++) {
      // Combine multiple entropy sources
      const entropy1 = Math.random() * 256;
      const entropy2 = (now + i) % 256;
      const entropy3 = (performance * (i + 1)) % 256;
      const entropy4 = (Math.random() * now) % 256;
      const combined = (entropy1 + entropy2 + entropy3 + entropy4) % 256;
      array[i] = Math.floor(combined);
    }

    return {
      success: true,
      data: array,
      method: 'basic',
      warnings
    };
  }

  /**
   * Hash data using SHA-256 with fallback
   */
  public static async hashData(data: string): Promise<CryptoFallbackResult<string>> {
    const warnings: string[] = [];

    try {
      // Try Web Crypto API first
      if (this.getSupportInfo().subtle) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = new Uint8Array(hashBuffer);
        const hashHex = Array.from(hashArray)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        return {
          success: true,
          data: hashHex,
          method: 'webcrypto',
          warnings
        };
      }
    } catch (error) {
      warnings.push(`Web Crypto API hashing failed: ${error.message}`);
    }

    try {
      // Try Node.js crypto if available
      if (typeof require !== 'undefined') {
        const nodeCrypto = require('crypto');
        const hash = nodeCrypto.createHash('sha256').update(data).digest('hex');
        return {
          success: true,
          data: hash,
          method: 'fallback',
          warnings
        };
      }
    } catch (error) {
      warnings.push(`Node.js crypto hashing failed: ${error.message}`);
    }

    // Simple hash fallback (not cryptographically secure)
    warnings.push('Using simple hash fallback - reduced security');
    let hash = 0;
    if (data.length === 0) {
      return {
        success: true,
        data: '0'.repeat(64),
        method: 'basic',
        warnings
      };
    }
    
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive hex and extend to 64 characters
    const positiveHash = Math.abs(hash);
    const hexHash = positiveHash.toString(16).padStart(8, '0');
    const extendedHash = hexHash.repeat(8).substring(0, 64);

    return {
      success: true,
      data: extendedHash,
      method: 'basic',
      warnings
    };
  }

  /**
   * Derive key using PBKDF2 with fallback
   */
  public static async deriveKey(
    password: string, 
    salt: string, 
    iterations: number = 100000
  ): Promise<CryptoFallbackResult<string>> {
    const warnings: string[] = [];

    try {
      // Try Web Crypto API first
      if (this.getSupportInfo().subtle) {
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        const saltData = encoder.encode(salt);
        
        const baseKey = await crypto.subtle.importKey(
          'raw',
          passwordData,
          { name: 'PBKDF2' },
          false,
          ['deriveBits']
        );
        
        const derivedKeyBuffer = await crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: saltData,
            iterations: iterations,
            hash: 'SHA-256'
          },
          baseKey,
          256
        );
        
        const derivedKeyArray = new Uint8Array(derivedKeyBuffer);
        const derivedKeyHex = Array.from(derivedKeyArray)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        return {
          success: true,
          data: derivedKeyHex,
          method: 'webcrypto',
          warnings
        };
      }
    } catch (error) {
      warnings.push(`Web Crypto API key derivation failed: ${error.message}`);
    }

    try {
      // Try Node.js crypto if available
      if (typeof require !== 'undefined') {
        const nodeCrypto = require('crypto');
        const derivedKey = nodeCrypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
        return {
          success: true,
          data: derivedKey.toString('hex'),
          method: 'fallback',
          warnings
        };
      }
    } catch (error) {
      warnings.push(`Node.js crypto key derivation failed: ${error.message}`);
    }

    // Simple key derivation fallback
    warnings.push('Using simple key derivation fallback - reduced security');
    let derivedKey = '';
    const combined = password + salt;
    
    // Simulate iterations by hashing multiple times
    let current = combined;
    const iterationsToUse = Math.min(iterations, 1000); // Limit for performance
    
    for (let i = 0; i < iterationsToUse; i++) {
      const hashResult = await this.hashData(current);
      if (hashResult.success && hashResult.data) {
        current = hashResult.data;
      }
    }
    
    derivedKey = current.substring(0, 64); // 32 bytes = 64 hex chars

    return {
      success: true,
      data: derivedKey,
      method: 'basic',
      warnings
    };
  }

  /**
   * Simple XOR encryption for fallback scenarios
   */
  public static simpleEncrypt(data: string, key: string): CryptoFallbackResult<string> {
    const warnings: string[] = [];
    warnings.push('Using XOR encryption - not cryptographically secure');

    try {
      let result = '';
      for (let i = 0; i < data.length; i++) {
        const dataChar = data.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        result += String.fromCharCode(dataChar ^ keyChar);
      }
      
      const encrypted = btoa(result);
      return {
        success: true,
        data: encrypted,
        method: 'basic',
        warnings
      };
    } catch (error) {
      return {
        success: false,
        method: 'basic',
        error: `Simple encryption failed: ${error.message}`,
        warnings
      };
    }
  }

  /**
   * Simple XOR decryption for fallback scenarios
   */
  public static simpleDecrypt(encryptedData: string, key: string): CryptoFallbackResult<string> {
    const warnings: string[] = [];
    warnings.push('Using XOR decryption - not cryptographically secure');

    try {
      const data = atob(encryptedData);
      let result = '';
      for (let i = 0; i < data.length; i++) {
        const dataChar = data.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        result += String.fromCharCode(dataChar ^ keyChar);
      }
      
      return {
        success: true,
        data: result,
        method: 'basic',
        warnings
      };
    } catch (error) {
      return {
        success: false,
        method: 'basic',
        error: `Simple decryption failed: ${error.message}`,
        warnings
      };
    }
  }

  /**
   * Generate a secure password with fallback
   */
  public static generateSecurePassword(length: number = 32): CryptoFallbackResult<string> {
    const randomResult = this.generateRandomBytes(length);
    
    if (randomResult.success && randomResult.data) {
      const password = btoa(String.fromCharCode(...randomResult.data));
      return {
        success: true,
        data: password,
        method: randomResult.method,
        warnings: randomResult.warnings
      };
    }

    return {
      success: false,
      method: 'basic',
      error: 'Failed to generate secure password',
      warnings: randomResult.warnings
    };
  }

  /**
   * Test crypto functionality and return detailed report
   */
  public static async testCryptoFunctionality(): Promise<{
    support: CryptoSupport;
    tests: {
      randomGeneration: CryptoFallbackResult<boolean>;
      hashing: CryptoFallbackResult<boolean>;
      keyDerivation: CryptoFallbackResult<boolean>;
      encryption: CryptoFallbackResult<boolean>;
    };
  }> {
    const support = this.getSupportInfo();
    
    // Test random generation
    const randomTest = this.generateRandomBytes(16);
    const randomResult: CryptoFallbackResult<boolean> = {
      success: randomTest.success,
      data: randomTest.success,
      method: randomTest.method,
      warnings: randomTest.warnings,
      error: randomTest.error
    };

    // Test hashing
    const hashTest = await this.hashData('test data');
    const hashResult: CryptoFallbackResult<boolean> = {
      success: hashTest.success,
      data: hashTest.success,
      method: hashTest.method,
      warnings: hashTest.warnings,
      error: hashTest.error
    };

    // Test key derivation
    const keyTest = await this.deriveKey('password', 'salt', 1000);
    const keyResult: CryptoFallbackResult<boolean> = {
      success: keyTest.success,
      data: keyTest.success,
      method: keyTest.method,
      warnings: keyTest.warnings,
      error: keyTest.error
    };

    // Test encryption
    const encryptTest = this.simpleEncrypt('test', 'key');
    const encryptResult: CryptoFallbackResult<boolean> = {
      success: encryptTest.success,
      data: encryptTest.success,
      method: encryptTest.method,
      warnings: encryptTest.warnings,
      error: encryptTest.error
    };

    return {
      support,
      tests: {
        randomGeneration: randomResult,
        hashing: hashResult,
        keyDerivation: keyResult,
        encryption: encryptResult
      }
    };
  }
}

/**
 * Convenience functions for common crypto operations
 */
export const cryptoFallback = {
  /**
   * Generate random bytes with automatic fallback
   */
  randomBytes: (length: number) => CryptoFallbackService.generateRandomBytes(length),
  
  /**
   * Hash data with automatic fallback
   */
  hash: (data: string) => CryptoFallbackService.hashData(data),
  
  /**
   * Derive key with automatic fallback
   */
  deriveKey: (password: string, salt: string, iterations?: number) => 
    CryptoFallbackService.deriveKey(password, salt, iterations),
  
  /**
   * Generate secure password with automatic fallback
   */
  generatePassword: (length?: number) => CryptoFallbackService.generateSecurePassword(length),
  
  /**
   * Get crypto support information
   */
  getSupport: () => CryptoFallbackService.getSupportInfo(),
  
  /**
   * Test all crypto functionality
   */
  test: () => CryptoFallbackService.testCryptoFunctionality()
};