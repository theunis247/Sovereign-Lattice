import { EncryptionService, SecureStorage, EncryptedData } from './encryption';

export interface APIKeyInfo {
  keyHash: string;
  createdAt: string;
  lastUsed?: string;
  isValid: boolean;
}

export interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

/**
 * Secure API Key Manager for DeepSeek API keys
 * Handles encryption, storage, and validation of user API keys
 */
export class APIKeyManager {
  private static readonly API_KEY_STORAGE_KEY = 'DEEPSEEK_API_KEY';
  private static readonly API_KEY_INFO_KEY = 'DEEPSEEK_API_KEY_INFO';
  private static readonly DEFAULT_BASE_URL = 'https://api.deepseek.com/v1';
  private static readonly DEFAULT_MODEL = 'deepseek-chat';

  private userPassword: string | null = null;

  constructor() {
    // Generate a unique password for this browser session
    this.userPassword = this.generateSessionPassword();
  }

  /**
   * Generate a session-specific password for encryption
   */
  private generateSessionPassword(): string {
    // Use a combination of user agent, timestamp, and random data
    const userAgent = navigator.userAgent;
    const timestamp = Date.now().toString();
    const random = EncryptionService.generateSecurePassword();
    
    return btoa(`${userAgent}:${timestamp}:${random}`);
  }

  /**
   * Store an API key securely
   */
  public async storeAPIKey(apiKey: string): Promise<void> {
    if (!EncryptionService.isSupported()) {
      throw new Error('Web Crypto API is not supported in this browser');
    }

    if (!this.validateAPIKeyFormat(apiKey)) {
      throw new Error('Invalid API key format');
    }

    try {
      // Encrypt the API key
      const encryptedData = await EncryptionService.encrypt(apiKey, this.userPassword!);
      
      // Store encrypted data
      SecureStorage.store(APIKeyManager.API_KEY_STORAGE_KEY, encryptedData);

      // Store key info (non-sensitive metadata)
      const keyHash = await EncryptionService.hash(apiKey);
      const keyInfo: APIKeyInfo = {
        keyHash,
        createdAt: new Date().toISOString(),
        isValid: true
      };
      
      localStorage.setItem(APIKeyManager.API_KEY_INFO_KEY, JSON.stringify(keyInfo));
      
    } catch (error) {
      throw new Error(`Failed to store API key: ${error.message}`);
    }
  }

  /**
   * Retrieve and decrypt the stored API key
   */
  public async getAPIKey(): Promise<string | null> {
    if (!EncryptionService.isSupported()) {
      throw new Error('Web Crypto API is not supported in this browser');
    }

    try {
      const encryptedData = SecureStorage.retrieve(APIKeyManager.API_KEY_STORAGE_KEY);
      
      if (!encryptedData) {
        return null;
      }

      // Decrypt the API key
      const apiKey = await EncryptionService.decrypt(encryptedData, this.userPassword!);
      
      // Update last used timestamp
      await this.updateLastUsed();
      
      return apiKey;
    } catch (error) {
      console.error('Failed to retrieve API key:', error.message);
      // If decryption fails, the key might be corrupted
      this.removeAPIKey();
      return null;
    }
  }

  /**
   * Remove the stored API key
   */
  public removeAPIKey(): void {
    SecureStorage.remove(APIKeyManager.API_KEY_STORAGE_KEY);
    localStorage.removeItem(APIKeyManager.API_KEY_INFO_KEY);
  }

  /**
   * Check if an API key is stored
   */
  public hasAPIKey(): boolean {
    return SecureStorage.exists(APIKeyManager.API_KEY_STORAGE_KEY);
  }

  /**
   * Get API key information (non-sensitive metadata)
   */
  public getAPIKeyInfo(): APIKeyInfo | null {
    try {
      const infoData = localStorage.getItem(APIKeyManager.API_KEY_INFO_KEY);
      if (!infoData) {
        return null;
      }
      return JSON.parse(infoData) as APIKeyInfo;
    } catch (error) {
      console.error('Failed to get API key info:', error.message);
      return null;
    }
  }

  /**
   * Validate API key with DeepSeek service
   */
  public async validateAPIKey(apiKey?: string): Promise<boolean> {
    try {
      const keyToValidate = apiKey || await this.getAPIKey();
      
      if (!keyToValidate) {
        return false;
      }

      // Test the API key with a simple request
      const response = await fetch(`${APIKeyManager.DEFAULT_BASE_URL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${keyToValidate}`,
          'Content-Type': 'application/json'
        }
      });

      const isValid = response.ok;
      
      // Update validation status
      await this.updateValidationStatus(isValid);
      
      return isValid;
    } catch (error) {
      console.error('API key validation failed:', error.message);
      await this.updateValidationStatus(false);
      return false;
    }
  }

  /**
   * Get DeepSeek configuration with stored API key
   */
  public async getDeepSeekConfig(): Promise<DeepSeekConfig | null> {
    const apiKey = await this.getAPIKey();
    
    if (!apiKey) {
      return null;
    }

    return {
      apiKey,
      baseUrl: APIKeyManager.DEFAULT_BASE_URL,
      model: APIKeyManager.DEFAULT_MODEL
    };
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(): Promise<void> {
    try {
      const keyInfo = this.getAPIKeyInfo();
      if (keyInfo) {
        keyInfo.lastUsed = new Date().toISOString();
        localStorage.setItem(APIKeyManager.API_KEY_INFO_KEY, JSON.stringify(keyInfo));
      }
    } catch (error) {
      console.error('Failed to update last used timestamp:', error.message);
    }
  }

  /**
   * Update API key validation status
   */
  private async updateValidationStatus(isValid: boolean): Promise<void> {
    try {
      const keyInfo = this.getAPIKeyInfo();
      if (keyInfo) {
        keyInfo.isValid = isValid;
        localStorage.setItem(APIKeyManager.API_KEY_INFO_KEY, JSON.stringify(keyInfo));
      }
    } catch (error) {
      console.error('Failed to update validation status:', error.message);
    }
  }

  /**
   * Validate API key format (basic format check)
   */
  private validateAPIKeyFormat(apiKey: string): boolean {
    // DeepSeek API keys typically start with 'sk-' and are 48+ characters
    return typeof apiKey === 'string' && 
           apiKey.length >= 20 && 
           apiKey.trim() === apiKey &&
           /^[a-zA-Z0-9\-_]+$/.test(apiKey);
  }

  /**
   * Clear all stored data
   */
  public clearAll(): void {
    this.removeAPIKey();
    SecureStorage.clearAll();
  }

  /**
   * Get security status
   */
  public getSecurityStatus(): {
    isSupported: boolean;
    hasKey: boolean;
    keyInfo: APIKeyInfo | null;
  } {
    return {
      isSupported: EncryptionService.isSupported(),
      hasKey: this.hasAPIKey(),
      keyInfo: this.getAPIKeyInfo()
    };
  }
}

// Singleton instance
export const apiKeyManager = new APIKeyManager();