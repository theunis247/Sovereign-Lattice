/**
 * Database Utilities
 * Provides convenient access to database initialization and recovery functions
 */

import { databaseInitialization, InitializationResult, RecoveryOptions, DataIntegrityReport } from './databaseInitialization';
import { databaseRecoveryManager, RecoveryStatus, EmergencyRecoveryResult } from './databaseRecoveryManager';
import { safeRegistry } from './safeRegistryService';
import { User } from '../types';

export interface DatabaseHealthCheck {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
  lastCheck: string;
  metrics: {
    totalUsers: number;
    validUsers: number;
    corruptedUsers: number;
    missingDirectories: number;
    availableBackups: number;
  };
}

export interface QuickRepairResult {
  success: boolean;
  repairedItems: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Database Utilities Class
 * Provides high-level database management functions
 */
export class DatabaseUtils {
  private static instance: DatabaseUtils;

  public static getInstance(): DatabaseUtils {
    if (!DatabaseUtils.instance) {
      DatabaseUtils.instance = new DatabaseUtils();
    }
    return DatabaseUtils.instance;
  }

  /**
   * Perform comprehensive database health check
   */
  public async performHealthCheck(): Promise<DatabaseHealthCheck> {
    const healthCheck: DatabaseHealthCheck = {
      isHealthy: true,
      issues: [],
      recommendations: [],
      lastCheck: new Date().toISOString(),
      metrics: {
        totalUsers: 0,
        validUsers: 0,
        corruptedUsers: 0,
        missingDirectories: 0,
        availableBackups: 0
      }
    };

    try {
      // Get integrity report
      const integrityReport = await databaseInitialization.generateIntegrityReport();
      
      healthCheck.metrics.totalUsers = integrityReport.totalUsers;
      healthCheck.metrics.validUsers = integrityReport.validUsers;
      healthCheck.metrics.corruptedUsers = integrityReport.corruptedUsers;
      healthCheck.metrics.missingDirectories = integrityReport.missingDirectories.length;
      healthCheck.metrics.availableBackups = integrityReport.backupsCreated;

      // Check for issues
      if (integrityReport.missingDirectories.length > 0) {
        healthCheck.isHealthy = false;
        healthCheck.issues.push(`Missing directories: ${integrityReport.missingDirectories.join(', ')}`);
        healthCheck.recommendations.push('Run database initialization to create missing directories');
      }

      if (integrityReport.corruptedUsers > 0) {
        healthCheck.isHealthy = false;
        healthCheck.issues.push(`${integrityReport.corruptedUsers} corrupted user files detected`);
        healthCheck.recommendations.push('Run database repair to fix corrupted user data');
      }

      if (integrityReport.totalUsers === 0) {
        healthCheck.issues.push('No users found in database');
        healthCheck.recommendations.push('This might be a new installation or data loss occurred');
      }

      if (integrityReport.backupsCreated === 0) {
        healthCheck.issues.push('No backups available');
        healthCheck.recommendations.push('Create a backup to protect against data loss');
      }

      // Check recovery manager status
      const recoveryStatus = databaseRecoveryManager.getStatus();
      if (recoveryStatus.hasErrors) {
        healthCheck.isHealthy = false;
        healthCheck.issues.push('Database recovery manager has errors');
        healthCheck.recommendations.push('Check recovery manager logs and resolve errors');
      }

      if (!recoveryStatus.isInitialized) {
        healthCheck.isHealthy = false;
        healthCheck.issues.push('Database not properly initialized');
        healthCheck.recommendations.push('Run database initialization');
      }

    } catch (error) {
      healthCheck.isHealthy = false;
      healthCheck.issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      healthCheck.recommendations.push('Contact system administrator');
    }

    return healthCheck;
  }

  /**
   * Quick repair for common database issues
   */
  public async quickRepair(): Promise<QuickRepairResult> {
    const result: QuickRepairResult = {
      success: false,
      repairedItems: [],
      errors: [],
      warnings: []
    };

    try {
      // Perform initialization with repair options
      const recoveryOptions: RecoveryOptions = {
        createMissingDirectories: true,
        repairCorruptedData: true,
        validateAllUsers: true,
        createBackups: true,
        forceDefaults: false
      };

      const initResult = await databaseInitialization.initializeDatabase(recoveryOptions);

      result.success = initResult.success;
      result.errors = initResult.errors;
      result.warnings = initResult.warnings;

      // Collect repaired items
      if (initResult.createdDirectories.length > 0) {
        result.repairedItems.push(`Created ${initResult.createdDirectories.length} missing directories`);
      }

      if (initResult.repairedUsers.length > 0) {
        result.repairedItems.push(`Repaired ${initResult.repairedUsers.length} user files`);
      }

      if (initResult.recoveredData.length > 0) {
        result.repairedItems.push(`Recovered ${initResult.recoveredData.length} data items`);
      }

    } catch (error) {
      result.errors.push(`Quick repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Create emergency backup of all data
   */
  public async createEmergencyBackup(): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    try {
      // Use the database recovery manager to create backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `./data/backups/emergency_backup_${timestamp}`;
      
      // Create backup using file system operations
      const fs = require('fs').promises;
      const path = require('path');
      
      await fs.mkdir(backupPath, { recursive: true });
      
      // Copy data directory contents
      const dataDir = './data';
      const items = await fs.readdir(dataDir);
      
      for (const item of items) {
        if (item === 'backups') continue; // Skip backups directory to avoid recursion
        
        const sourcePath = path.join(dataDir, item);
        const destPath = path.join(backupPath, item);
        
        try {
          const stats = await fs.stat(sourcePath);
          if (stats.isFile()) {
            await fs.copyFile(sourcePath, destPath);
          } else if (stats.isDirectory()) {
            await this.copyDirectoryRecursive(sourcePath, destPath);
          }
        } catch (error) {
          console.warn(`Failed to backup ${item}:`, error);
        }
      }
      
      // Create backup manifest
      const manifest = {
        created: new Date().toISOString(),
        type: 'emergency_backup',
        source: 'databaseUtils'
      };
      
      await fs.writeFile(
        path.join(backupPath, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );
      
      return {
        success: true,
        backupPath: backupPath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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
   * Validate specific user and repair if needed
   */
  public async validateAndRepairUser(userIdentifier: string): Promise<{
    success: boolean;
    user?: User;
    wasRepaired: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const result = {
      success: false,
      user: undefined as User | undefined,
      wasRepaired: false,
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      // Get user safely with automatic repair
      const safeResult = await safeRegistry.getUserSafely(userIdentifier);
      
      result.success = safeResult.user !== null;
      result.user = safeResult.user || undefined;
      result.errors = safeResult.errors;
      result.warnings = safeResult.warnings;
      result.wasRepaired = safeResult.warnings.some(w => w.includes('Fixed'));

    } catch (error) {
      result.errors.push(`User validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Get database statistics
   */
  public async getDatabaseStatistics(): Promise<{
    totalUsers: number;
    validUsers: number;
    corruptedUsers: number;
    totalTransactions: number;
    totalBackups: number;
    databaseSize: string;
    lastMaintenance: string | null;
  }> {
    const stats = {
      totalUsers: 0,
      validUsers: 0,
      corruptedUsers: 0,
      totalTransactions: 0,
      totalBackups: 0,
      databaseSize: '0 MB',
      lastMaintenance: null as string | null
    };

    try {
      const integrityReport = await databaseInitialization.generateIntegrityReport();
      
      stats.totalUsers = integrityReport.totalUsers;
      stats.validUsers = integrityReport.validUsers;
      stats.corruptedUsers = integrityReport.corruptedUsers;
      stats.totalBackups = integrityReport.backupsCreated;

      // Get recovery status for last maintenance
      const recoveryStatus = databaseRecoveryManager.getStatus();
      stats.lastMaintenance = recoveryStatus.lastInitialization || recoveryStatus.lastRecovery;

      // Calculate database size (simplified)
      try {
        const fs = require('fs');
        const path = require('path');
        
        const getDirectorySize = (dirPath: string): number => {
          let totalSize = 0;
          try {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
              const filePath = path.join(dirPath, file);
              const stats = fs.statSync(filePath);
              if (stats.isDirectory()) {
                totalSize += getDirectorySize(filePath);
              } else {
                totalSize += stats.size;
              }
            }
          } catch (error) {
            // Directory might not exist
          }
          return totalSize;
        };

        const sizeBytes = getDirectorySize('./data');
        const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
        stats.databaseSize = `${sizeMB} MB`;

      } catch (error) {
        stats.databaseSize = 'Unknown';
      }

    } catch (error) {
      console.error('Failed to get database statistics:', error);
    }

    return stats;
  }

  /**
   * Initialize database with custom options
   */
  public async initializeDatabase(options?: Partial<RecoveryOptions>): Promise<InitializationResult> {
    const defaultOptions: RecoveryOptions = {
      createMissingDirectories: true,
      repairCorruptedData: true,
      validateAllUsers: true,
      createBackups: true,
      forceDefaults: false
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    return await databaseInitialization.initializeDatabase(finalOptions);
  }

  /**
   * Get recovery manager status
   */
  public getRecoveryStatus(): RecoveryStatus {
    return databaseRecoveryManager.getStatus();
  }

  /**
   * Force emergency recovery
   */
  public async forceEmergencyRecovery(): Promise<InitializationResult> {
    return await databaseRecoveryManager.initializeWithRecovery();
  }

  /**
   * Validate all users and return summary
   */
  public async validateAllUsers(): Promise<{
    totalUsers: number;
    validUsers: number;
    repairedUsers: number;
    errors: string[];
  }> {
    const summary = {
      totalUsers: 0,
      validUsers: 0,
      repairedUsers: 0,
      errors: [] as string[]
    };

    try {
      const safeResult = await safeRegistry.getAllUsersSafely();
      
      summary.totalUsers = safeResult.users.length;
      summary.validUsers = safeResult.users.filter(user => 
        safeRegistry.isValidUserStructure(user)
      ).length;
      
      // Count repaired users from warnings
      summary.repairedUsers = safeResult.warnings.filter(warning => 
        warning.includes('Fixed missing fields')
      ).length;
      
      summary.errors = safeResult.errors;

    } catch (error) {
      summary.errors.push(`User validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return summary;
  }

  /**
   * Clean up old backups (keep only recent ones)
   */
  public async cleanupOldBackups(keepCount: number = 10): Promise<{
    success: boolean;
    deletedCount: number;
    errors: string[];
  }> {
    const result = {
      success: false,
      deletedCount: 0,
      errors: [] as string[]
    };

    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const backupDir = './data/backups';
      
      try {
        const files = await fs.readdir(backupDir);
        const backupFiles = files
          .filter(file => file.startsWith('backup_') || file.startsWith('system_backup_'))
          .map(file => ({
            name: file,
            path: path.join(backupDir, file),
            stats: null as any
          }));

        // Get file stats and sort by creation time
        for (const backup of backupFiles) {
          try {
            backup.stats = await fs.stat(backup.path);
          } catch (error) {
            result.errors.push(`Failed to get stats for ${backup.name}`);
          }
        }

        const validBackups = backupFiles
          .filter(backup => backup.stats)
          .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

        // Delete old backups
        if (validBackups.length > keepCount) {
          const toDelete = validBackups.slice(keepCount);
          
          for (const backup of toDelete) {
            try {
              await fs.rm(backup.path, { recursive: true, force: true });
              result.deletedCount++;
            } catch (error) {
              result.errors.push(`Failed to delete ${backup.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }

        result.success = result.errors.length === 0;

      } catch (error) {
        result.errors.push(`Failed to access backup directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } catch (error) {
      result.errors.push(`Backup cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }
}

// Export singleton instance
export const databaseUtils = DatabaseUtils.getInstance();

// Export convenience functions
export const performHealthCheck = () => databaseUtils.performHealthCheck();
export const quickRepair = () => databaseUtils.quickRepair();
export const createEmergencyBackup = () => databaseUtils.createEmergencyBackup();
export const validateAndRepairUser = (userIdentifier: string) => databaseUtils.validateAndRepairUser(userIdentifier);
export const getDatabaseStatistics = () => databaseUtils.getDatabaseStatistics();
export const initializeDatabase = (options?: Partial<RecoveryOptions>) => databaseUtils.initializeDatabase(options);
export const getRecoveryStatus = () => databaseUtils.getRecoveryStatus();
export const forceEmergencyRecovery = () => databaseUtils.forceEmergencyRecovery();
export const validateAllUsers = () => databaseUtils.validateAllUsers();
export const cleanupOldBackups = (keepCount?: number) => databaseUtils.cleanupOldBackups(keepCount);