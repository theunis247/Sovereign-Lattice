/**
 * Database Recovery Manager
 * Manages automatic database recovery and initialization on application startup
 */

import { databaseInitialization, InitializationResult, RecoveryOptions, DataIntegrityReport } from './databaseInitialization';
import { safeRegistry } from './safeRegistryService';
import { User } from '../types';

export interface RecoveryManagerConfig {
  autoInitializeOnStartup: boolean;
  autoRepairCorruption: boolean;
  createBackupsOnRepair: boolean;
  maxRecoveryAttempts: number;
  recoveryTimeoutMs: number;
  enableDetailedLogging: boolean;
}

export interface RecoveryStatus {
  isInitialized: boolean;
  lastInitialization: string | null;
  lastRecovery: string | null;
  totalRecoveries: number;
  hasErrors: boolean;
  errors: string[];
  warnings: string[];
}

export interface EmergencyRecoveryResult {
  success: boolean;
  recoveredUsers: number;
  createdDefaults: number;
  errors: string[];
  backupCreated: boolean;
}

/**
 * Database Recovery Manager
 * Handles automatic recovery, monitoring, and emergency procedures
 */
export class DatabaseRecoveryManager {
  private static instance: DatabaseRecoveryManager;
  private config: RecoveryManagerConfig;
  private status: RecoveryStatus;
  private isRecovering: boolean = false;
  private recoveryPromise: Promise<InitializationResult> | null = null;

  constructor(config: Partial<RecoveryManagerConfig> = {}) {
    this.config = {
      autoInitializeOnStartup: true,
      autoRepairCorruption: true,
      createBackupsOnRepair: true,
      maxRecoveryAttempts: 3,
      recoveryTimeoutMs: 30000,
      enableDetailedLogging: true,
      ...config
    };

    this.status = {
      isInitialized: false,
      lastInitialization: null,
      lastRecovery: null,
      totalRecoveries: 0,
      hasErrors: false,
      errors: [],
      warnings: []
    };
  }

  public static getInstance(config?: Partial<RecoveryManagerConfig>): DatabaseRecoveryManager {
    if (!DatabaseRecoveryManager.instance) {
      DatabaseRecoveryManager.instance = new DatabaseRecoveryManager(config);
    }
    return DatabaseRecoveryManager.instance;
  }

  /**
   * Initialize database with automatic recovery
   */
  public async initializeWithRecovery(): Promise<InitializationResult> {
    if (this.isRecovering && this.recoveryPromise) {
      this.log('Recovery already in progress, waiting for completion...');
      return await this.recoveryPromise;
    }

    this.isRecovering = true;
    this.recoveryPromise = this.performInitialization();

    try {
      const result = await this.recoveryPromise;
      this.updateStatus(result);
      return result;
    } finally {
      this.isRecovering = false;
      this.recoveryPromise = null;
    }
  }

  /**
   * Perform the actual initialization with recovery
   */
  private async performInitialization(): Promise<InitializationResult> {
    const startTime = Date.now();
    this.log('Starting database initialization with recovery...');

    try {
      // Create recovery options based on configuration
      const recoveryOptions: RecoveryOptions = {
        createMissingDirectories: true,
        repairCorruptedData: this.config.autoRepairCorruption,
        validateAllUsers: true,
        createBackups: this.config.createBackupsOnRepair,
        forceDefaults: false
      };

      // Perform initialization with timeout
      const result = await this.withTimeout(
        databaseInitialization.initializeDatabase(recoveryOptions),
        this.config.recoveryTimeoutMs
      );

      const duration = Date.now() - startTime;
      this.log(`Database initialization completed in ${duration}ms`);

      // If there were errors, attempt emergency recovery
      if (!result.success && result.errors.length > 0) {
        this.log('Standard initialization failed, attempting emergency recovery...');
        const emergencyResult = await this.performEmergencyRecovery();
        
        if (emergencyResult.success) {
          result.success = true;
          result.warnings.push('Emergency recovery was successful');
          result.recoveredData.push(`Emergency recovery: ${emergencyResult.recoveredUsers} users`);
        }
      }

      return result;

    } catch (error) {
      this.log(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Attempt emergency recovery as last resort
      const emergencyResult = await this.performEmergencyRecovery();
      
      return {
        success: emergencyResult.success,
        errors: emergencyResult.success ? [] : [`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: emergencyResult.success ? ['Emergency recovery was used'] : [],
        createdDirectories: [],
        repairedUsers: [],
        recoveredData: emergencyResult.success ? [`Emergency recovery: ${emergencyResult.recoveredUsers} users`] : []
      };
    }
  }

  /**
   * Perform emergency recovery when standard initialization fails
   */
  private async performEmergencyRecovery(): Promise<EmergencyRecoveryResult> {
    const result: EmergencyRecoveryResult = {
      success: false,
      recoveredUsers: 0,
      createdDefaults: 0,
      errors: [],
      backupCreated: false
    };

    try {
      this.log('Starting emergency recovery procedure...');

      // Step 1: Create emergency backup of current state
      try {
        await this.createEmergencyBackup();
        result.backupCreated = true;
        this.log('Emergency backup created');
      } catch (error) {
        result.errors.push('Failed to create emergency backup');
      }

      // Step 2: Ensure basic directory structure exists
      try {
        await this.ensureBasicDirectoryStructure();
        this.log('Basic directory structure ensured');
      } catch (error) {
        result.errors.push('Failed to create basic directories');
        return result;
      }

      // Step 3: Attempt to recover existing users
      try {
        const recoveredCount = await this.recoverExistingUsers();
        result.recoveredUsers = recoveredCount;
        this.log(`Recovered ${recoveredCount} existing users`);
      } catch (error) {
        result.errors.push('Failed to recover existing users');
      }

      // Step 4: Create default system files
      try {
        await this.createDefaultSystemFiles();
        result.createdDefaults++;
        this.log('Default system files created');
      } catch (error) {
        result.errors.push('Failed to create default system files');
      }

      // Step 5: Validate recovery success
      const isValid = await this.validateEmergencyRecovery();
      result.success = isValid && result.errors.length === 0;

      if (result.success) {
        this.log('Emergency recovery completed successfully');
      } else {
        this.log('Emergency recovery completed with errors');
      }

      return result;

    } catch (error) {
      result.errors.push(`Emergency recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Ensure basic directory structure exists
   */
  private async ensureBasicDirectoryStructure(): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');

    const requiredDirs = [
      './data',
      './data/users',
      './data/profiles',
      './data/credentials',
      './data/balances',
      './data/transactions',
      './data/backups',
      './data/recovery',
      './data/recovery/emergency'
    ];

    for (const dir of requiredDirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist, which is fine
        if ((error as any).code !== 'EEXIST') {
          throw error;
        }
      }
    }
  }

  /**
   * Recover existing users with minimal validation
   */
  private async recoverExistingUsers(): Promise<number> {
    const fs = require('fs').promises;
    const path = require('path');
    let recoveredCount = 0;

    try {
      const usersDir = './data/users';
      const files = await fs.readdir(usersDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const filePath = path.join(usersDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const userData = JSON.parse(content);

          // Basic validation and repair
          if (userData && typeof userData === 'object' && userData.address) {
            const repairedUser = safeRegistry.initializeUserDataStructures(userData);
            
            // Save repaired user
            await fs.writeFile(filePath, JSON.stringify(repairedUser, null, 2));
            recoveredCount++;
            
            this.log(`Recovered user: ${repairedUser.username || repairedUser.address}`);
          }
        } catch (error) {
          this.log(`Failed to recover user file ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      this.log(`Failed to access users directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return recoveredCount;
  }

  /**
   * Create default system files
   */
  private async createDefaultSystemFiles(): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');

    const defaultFiles = {
      'user-registry.json': {
        users: {},
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        emergencyRecovery: true
      },
      'founder-registry.json': {
        founders: {},
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        emergencyRecovery: true
      },
      'db-metadata.json': {
        version: '1.0.0',
        created: new Date().toISOString(),
        lastMaintenance: new Date().toISOString(),
        totalUsers: 0,
        totalTransactions: 0,
        emergencyRecovery: true,
        recoveryTimestamp: new Date().toISOString()
      }
    };

    for (const [fileName, content] of Object.entries(defaultFiles)) {
      try {
        const filePath = path.join('./data', fileName);
        await fs.writeFile(filePath, JSON.stringify(content, null, 2));
      } catch (error) {
        throw new Error(`Failed to create ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Create emergency backup
   */
  private async createEmergencyBackup(): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `./data/recovery/emergency/backup_${timestamp}`;

    try {
      await fs.mkdir(backupDir, { recursive: true });

      // Copy existing data directory contents
      try {
        const dataDir = './data';
        const items = await fs.readdir(dataDir);

        for (const item of items) {
          const sourcePath = path.join(dataDir, item);
          const destPath = path.join(backupDir, item);

          try {
            const stats = await fs.stat(sourcePath);
            if (stats.isFile()) {
              await fs.copyFile(sourcePath, destPath);
            } else if (stats.isDirectory() && item !== 'recovery') {
              await this.copyDirectoryRecursive(sourcePath, destPath);
            }
          } catch (error) {
            // Continue with other files if one fails
            this.log(`Failed to backup ${item}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } catch (error) {
        // Data directory might not exist yet
        this.log('No existing data directory to backup');
      }

      // Create backup manifest
      const manifest = {
        created: new Date().toISOString(),
        type: 'emergency_backup',
        reason: 'Database initialization failure',
        originalDataExists: true
      };

      await fs.writeFile(
        path.join(backupDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

    } catch (error) {
      throw new Error(`Emergency backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectoryRecursive(source: string, dest: string): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');

    await fs.mkdir(dest, { recursive: true });
    const items = await fs.readdir(source);

    for (const item of items) {
      const sourcePath = path.join(source, item);
      const destPath = path.join(dest, item);

      const stats = await fs.stat(sourcePath);
      if (stats.isFile()) {
        await fs.copyFile(sourcePath, destPath);
      } else if (stats.isDirectory()) {
        await this.copyDirectoryRecursive(sourcePath, destPath);
      }
    }
  }

  /**
   * Validate emergency recovery success
   */
  private async validateEmergencyRecovery(): Promise<boolean> {
    try {
      const fs = require('fs').promises;

      // Check if basic directories exist
      const requiredDirs = ['./data', './data/users', './data/profiles'];
      for (const dir of requiredDirs) {
        try {
          await fs.access(dir);
        } catch {
          return false;
        }
      }

      // Check if basic registry files exist
      const requiredFiles = ['./data/user-registry.json', './data/db-metadata.json'];
      for (const file of requiredFiles) {
        try {
          await fs.access(file);
        } catch {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current recovery status
   */
  public getStatus(): RecoveryStatus {
    return { ...this.status };
  }

  /**
   * Generate integrity report
   */
  public async generateIntegrityReport(): Promise<DataIntegrityReport> {
    try {
      return await databaseInitialization.generateIntegrityReport();
    } catch (error) {
      this.log(`Failed to generate integrity report: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        totalUsers: 0,
        validUsers: 0,
        corruptedUsers: 0,
        missingDirectories: [],
        repairedFields: [],
        backupsCreated: 0
      };
    }
  }

  /**
   * Force recovery of specific user
   */
  public async recoverUser(userIdentifier: string): Promise<{ success: boolean; user?: User; errors: string[] }> {
    const result = {
      success: false,
      user: undefined as User | undefined,
      errors: [] as string[]
    };

    try {
      // Try to get user safely
      const safeResult = await safeRegistry.getUserSafely(userIdentifier);
      
      if (safeResult.user) {
        result.success = true;
        result.user = safeResult.user;
        
        if (safeResult.warnings.length > 0) {
          this.log(`User recovery warnings for ${userIdentifier}: ${safeResult.warnings.join(', ')}`);
        }
      } else {
        result.errors = safeResult.errors;
      }

    } catch (error) {
      result.errors.push(`User recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Update recovery status
   */
  private updateStatus(result: InitializationResult): void {
    this.status.isInitialized = result.success;
    this.status.lastInitialization = new Date().toISOString();
    
    if (result.repairedUsers.length > 0 || result.recoveredData.length > 0) {
      this.status.lastRecovery = new Date().toISOString();
      this.status.totalRecoveries++;
    }
    
    this.status.hasErrors = result.errors.length > 0;
    this.status.errors = result.errors;
    this.status.warnings = result.warnings;

    if (this.config.enableDetailedLogging) {
      this.log(`Status updated: ${JSON.stringify(this.status, null, 2)}`);
    }
  }

  /**
   * Execute with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeout));
    });
  }

  /**
   * Log message with timestamp
   */
  private log(message: string): void {
    if (this.config.enableDetailedLogging) {
      console.log(`[DatabaseRecoveryManager] ${new Date().toISOString()}: ${message}`);
    }
  }

  /**
   * Reset recovery manager (for testing)
   */
  public reset(): void {
    this.status = {
      isInitialized: false,
      lastInitialization: null,
      lastRecovery: null,
      totalRecoveries: 0,
      hasErrors: false,
      errors: [],
      warnings: []
    };
    this.isRecovering = false;
    this.recoveryPromise = null;
  }
}

// Export singleton instance with default configuration
export const databaseRecoveryManager = DatabaseRecoveryManager.getInstance();