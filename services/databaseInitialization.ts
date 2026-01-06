/**
 * Database Initialization and Recovery System
 * Handles automatic creation of missing user data directories, validation, and recovery
 */

import { User, Contact, Transaction, SecurityIncident, SolvedBlock, QBSNFT, Milestone } from '../types';
import { safeRegistry } from './safeRegistryService';
import * as fs from 'fs';
import * as path from 'path';

export interface InitializationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  createdDirectories: string[];
  repairedUsers: string[];
  recoveredData: string[];
}

export interface RecoveryOptions {
  createMissingDirectories: boolean;
  repairCorruptedData: boolean;
  validateAllUsers: boolean;
  createBackups: boolean;
  forceDefaults: boolean;
}

export interface DataIntegrityReport {
  totalUsers: number;
  validUsers: number;
  corruptedUsers: number;
  missingDirectories: string[];
  repairedFields: string[];
  backupsCreated: number;
}

/**
 * Database Initialization and Recovery Service
 */
export class DatabaseInitializationService {
  private static instance: DatabaseInitializationService;
  private readonly dataBasePath: string;
  private readonly requiredDirectories: string[];
  private readonly backupPath: string;

  constructor() {
    this.dataBasePath = path.resolve('./data');
    this.requiredDirectories = [
      'users',
      'profiles', 
      'credentials',
      'balances',
      'transactions',
      'backups',
      'recovery'
    ];
    this.backupPath = path.join(this.dataBasePath, 'backups');
  }

  public static getInstance(): DatabaseInitializationService {
    if (!DatabaseInitializationService.instance) {
      DatabaseInitializationService.instance = new DatabaseInitializationService();
    }
    return DatabaseInitializationService.instance;
  }

  /**
   * Initialize the complete database system with recovery
   */
  public async initializeDatabase(options: RecoveryOptions = {
    createMissingDirectories: true,
    repairCorruptedData: true,
    validateAllUsers: true,
    createBackups: true,
    forceDefaults: false
  }): Promise<InitializationResult> {
    const result: InitializationResult = {
      success: false,
      errors: [],
      warnings: [],
      createdDirectories: [],
      repairedUsers: [],
      recoveredData: []
    };

    try {
      console.log('Starting database initialization and recovery...');

      // Step 1: Create missing directories
      if (options.createMissingDirectories) {
        const dirResult = await this.createMissingDirectories();
        result.createdDirectories = dirResult.created;
        result.errors.push(...dirResult.errors);
        result.warnings.push(...dirResult.warnings);
      }

      // Step 2: Validate and repair user data
      if (options.validateAllUsers) {
        const validationResult = await this.validateAndRepairAllUsers(options);
        result.repairedUsers = validationResult.repairedUsers;
        result.recoveredData = validationResult.recoveredData;
        result.errors.push(...validationResult.errors);
        result.warnings.push(...validationResult.warnings);
      }

      // Step 3: Initialize registry files
      const registryResult = await this.initializeRegistryFiles();
      result.errors.push(...registryResult.errors);
      result.warnings.push(...registryResult.warnings);

      // Step 4: Create system backups
      if (options.createBackups) {
        const backupResult = await this.createSystemBackup();
        if (backupResult.success) {
          result.warnings.push('System backup created successfully');
        } else {
          result.warnings.push('Failed to create system backup');
        }
      }

      result.success = result.errors.length === 0;
      console.log('Database initialization completed:', result.success ? 'SUCCESS' : 'WITH ERRORS');

      return result;
    } catch (error) {
      result.errors.push(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
      return result;
    }
  }

  /**
   * Create missing data directories
   */
  private async createMissingDirectories(): Promise<{
    created: string[];
    errors: string[];
    warnings: string[];
  }> {
    const result = {
      created: [] as string[],
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      // Ensure base data directory exists
      if (!this.directoryExists(this.dataBasePath)) {
        await this.createDirectory(this.dataBasePath);
        result.created.push(this.dataBasePath);
      }

      // Create all required subdirectories
      for (const dir of this.requiredDirectories) {
        const fullPath = path.join(this.dataBasePath, dir);
        
        if (!this.directoryExists(fullPath)) {
          try {
            await this.createDirectory(fullPath);
            result.created.push(fullPath);
            console.log(`Created directory: ${fullPath}`);
          } catch (error) {
            result.errors.push(`Failed to create directory ${fullPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Create additional recovery directories
      const recoveryDirs = ['corrupted', 'restored', 'logs'];
      for (const dir of recoveryDirs) {
        const fullPath = path.join(this.dataBasePath, 'recovery', dir);
        
        if (!this.directoryExists(fullPath)) {
          try {
            await this.createDirectory(fullPath);
            result.created.push(fullPath);
          } catch (error) {
            result.warnings.push(`Could not create recovery directory ${fullPath}`);
          }
        }
      }

    } catch (error) {
      result.errors.push(`Directory creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate and repair all user data
   */
  private async validateAndRepairAllUsers(options: RecoveryOptions): Promise<{
    repairedUsers: string[];
    recoveredData: string[];
    errors: string[];
    warnings: string[];
  }> {
    const result = {
      repairedUsers: [] as string[],
      recoveredData: [] as string[],
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      const usersDir = path.join(this.dataBasePath, 'users');
      
      if (!this.directoryExists(usersDir)) {
        result.warnings.push('Users directory does not exist, creating it');
        await this.createDirectory(usersDir);
        return result;
      }

      // Get all user files
      const userFiles = await this.getUserFiles();
      
      for (const userFile of userFiles) {
        try {
          const repairResult = await this.validateAndRepairUserFile(userFile, options);
          
          if (repairResult.wasRepaired) {
            result.repairedUsers.push(userFile);
          }
          
          if (repairResult.wasRecovered) {
            result.recoveredData.push(userFile);
          }
          
          result.warnings.push(...repairResult.warnings);
          
        } catch (error) {
          result.errors.push(`Failed to process user file ${userFile}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Attempt recovery for corrupted files
          if (options.repairCorruptedData) {
            const recoveryResult = await this.recoverCorruptedUserFile(userFile);
            if (recoveryResult.success) {
              result.recoveredData.push(userFile);
              result.warnings.push(`Recovered corrupted user file: ${userFile}`);
            }
          }
        }
      }

    } catch (error) {
      result.errors.push(`User validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate and repair individual user file
   */
  private async validateAndRepairUserFile(userFile: string, options: RecoveryOptions): Promise<{
    wasRepaired: boolean;
    wasRecovered: boolean;
    warnings: string[];
  }> {
    const result = {
      wasRepaired: false,
      wasRecovered: false,
      warnings: [] as string[]
    };

    try {
      const filePath = path.join(this.dataBasePath, 'users', userFile);
      
      // Read and parse user data
      const userData = await this.readUserFile(filePath);
      
      if (!userData) {
        throw new Error('Could not read user data');
      }

      // Validate using safe registry service
      const validationResult = safeRegistry.validateAndFixUserStructure(userData);
      
      if (validationResult.fixedFields.length > 0) {
        // Save repaired user data
        await this.writeUserFile(filePath, userData);
        result.wasRepaired = true;
        result.warnings.push(`Repaired ${validationResult.fixedFields.length} fields in ${userFile}`);
      }

      // Create backup if user was repaired
      if (result.wasRepaired && options.createBackups) {
        await this.createUserBackup(userFile, userData);
      }

      // Additional data structure validation
      const structureResult = await this.validateUserDataStructure(userData, options);
      if (structureResult.wasFixed) {
        await this.writeUserFile(filePath, userData);
        result.wasRepaired = true;
        result.warnings.push(...structureResult.warnings);
      }

    } catch (error) {
      throw new Error(`User file validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate user data structure and fix issues
   */
  private async validateUserDataStructure(user: User, options: RecoveryOptions): Promise<{
    wasFixed: boolean;
    warnings: string[];
  }> {
    const result = {
      wasFixed: false,
      warnings: [] as string[]
    };

    try {
      let needsSave = false;

      // Validate and fix array structures
      if (!Array.isArray(user.contacts)) {
        user.contacts = [];
        needsSave = true;
        result.warnings.push('Fixed contacts array');
      }

      if (!Array.isArray(user.transactions)) {
        user.transactions = [];
        needsSave = true;
        result.warnings.push('Fixed transactions array');
      }

      if (!Array.isArray(user.incidents)) {
        user.incidents = [];
        needsSave = true;
        result.warnings.push('Fixed incidents array');
      }

      if (!Array.isArray(user.solvedBlocks)) {
        user.solvedBlocks = [];
        needsSave = true;
        result.warnings.push('Fixed solvedBlocks array');
      }

      if (!Array.isArray(user.ownedNfts)) {
        user.ownedNfts = [];
        needsSave = true;
        result.warnings.push('Fixed ownedNfts array');
      }

      if (!Array.isArray(user.milestones)) {
        user.milestones = [];
        needsSave = true;
        result.warnings.push('Fixed milestones array');
      }

      if (!Array.isArray(user.groups)) {
        user.groups = [];
        needsSave = true;
        result.warnings.push('Fixed groups array');
      }

      // Validate and fix object structures
      if (!user.votes || typeof user.votes !== 'object') {
        user.votes = {};
        needsSave = true;
        result.warnings.push('Fixed votes object');
      }

      // Validate and fix numeric fields
      const numericFields = ['balance', 'usdBalance', 'stakedBalance', 'reputationScore', 'shardsTowardNextQBS', 'xp', 'level'];
      for (const field of numericFields) {
        if (typeof user[field as keyof User] !== 'number' || isNaN(user[field as keyof User] as number)) {
          const defaultValue = field === 'level' ? 1 : 0;
          (user as any)[field] = defaultValue;
          needsSave = true;
          result.warnings.push(`Fixed ${field} field`);
        }
      }

      // Validate and fix boolean fields
      const booleanFields = ['messagingActive', 'miningActive', 'discoveryVisible'];
      for (const field of booleanFields) {
        if (typeof user[field as keyof User] !== 'boolean') {
          const defaultValue = field === 'discoveryVisible' ? true : false;
          (user as any)[field] = defaultValue;
          needsSave = true;
          result.warnings.push(`Fixed ${field} field`);
        }
      }

      // Validate and fix string fields
      const stringFields = ['address', 'username', 'passwordHash', 'salt', 'role', 'profileId'];
      for (const field of stringFields) {
        if (!user[field as keyof User] || typeof user[field as keyof User] !== 'string') {
          if (field === 'role') {
            (user as any)[field] = 'user';
          } else if (field === 'profileId' && user.username) {
            (user as any)[field] = `${user.username}_${Date.now()}`;
          } else if (options.forceDefaults) {
            (user as any)[field] = '';
          }
          needsSave = true;
          result.warnings.push(`Fixed ${field} field`);
        }
      }

      // Validate nested array data
      await this.validateNestedArrayData(user);

      result.wasFixed = needsSave;

    } catch (error) {
      result.warnings.push(`Structure validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate nested array data structures
   */
  private async validateNestedArrayData(user: User): Promise<void> {
    try {
      // Validate contacts
      user.contacts = user.contacts.filter(contact => {
        return contact && 
               typeof contact === 'object' && 
               contact.name && 
               contact.address && 
               typeof contact.name === 'string' && 
               typeof contact.address === 'string';
      });

      // Validate transactions
      user.transactions = user.transactions.filter(transaction => {
        return transaction && 
               typeof transaction === 'object' && 
               transaction.id && 
               transaction.timestamp && 
               transaction.type && 
               transaction.amount && 
               transaction.unit && 
               transaction.description;
      });

      // Validate incidents
      user.incidents = user.incidents.filter(incident => {
        return incident && 
               typeof incident === 'object' && 
               incident.id && 
               incident.timestamp && 
               incident.severity;
      });

      // Validate solved blocks
      user.solvedBlocks = user.solvedBlocks.filter(block => {
        return block && 
               typeof block === 'object' && 
               block.id && 
               block.shardId && 
               block.timestamp && 
               block.problem && 
               block.answer;
      });

      // Validate NFTs
      user.ownedNfts = user.ownedNfts.filter(nft => {
        return nft && 
               typeof nft === 'object' && 
               typeof nft.tokenId === 'number' && 
               nft.title && 
               nft.domain && 
               nft.mintDate;
      });

    } catch (error) {
      console.warn('Error validating nested array data:', error);
    }
  }

  /**
   * Recover corrupted user file
   */
  private async recoverCorruptedUserFile(userFile: string): Promise<{
    success: boolean;
    recoveredUser?: User;
  }> {
    try {
      const filePath = path.join(this.dataBasePath, 'users', userFile);
      const corruptedPath = path.join(this.dataBasePath, 'recovery', 'corrupted', userFile);
      
      // Move corrupted file to recovery directory
      await this.moveFile(filePath, corruptedPath);
      
      // Try to extract any recoverable data
      const partialData = await this.extractRecoverableData(corruptedPath);
      
      // Create new user with recovered data and safe defaults
      const recoveredUser = this.createUserWithDefaults(partialData);
      
      // Save recovered user
      await this.writeUserFile(filePath, recoveredUser);
      
      // Log recovery
      await this.logRecoveryAction(userFile, 'CORRUPTED_FILE_RECOVERED');
      
      return {
        success: true,
        recoveredUser
      };
      
    } catch (error) {
      console.error(`Failed to recover corrupted user file ${userFile}:`, error);
      return { success: false };
    }
  }

  /**
   * Extract recoverable data from corrupted file
   */
  private async extractRecoverableData(filePath: string): Promise<Partial<User>> {
    const recoverable: Partial<User> = {};
    
    try {
      const content = await this.readFileContent(filePath);
      
      // Try to extract basic fields using regex patterns
      const patterns = {
        address: /"address"\s*:\s*"([^"]+)"/,
        username: /"username"\s*:\s*"([^"]+)"/,
        profileId: /"profileId"\s*:\s*"([^"]+)"/,
        balance: /"balance"\s*:\s*(\d+(?:\.\d+)?)/,
        level: /"level"\s*:\s*(\d+)/,
        xp: /"xp"\s*:\s*(\d+)/
      };
      
      for (const [field, pattern] of Object.entries(patterns)) {
        const match = content.match(pattern);
        if (match) {
          if (field === 'balance' || field === 'level' || field === 'xp') {
            (recoverable as any)[field] = parseFloat(match[1]);
          } else {
            (recoverable as any)[field] = match[1];
          }
        }
      }
      
    } catch (error) {
      console.warn('Could not extract recoverable data:', error);
    }
    
    return recoverable;
  }

  /**
   * Create user with safe defaults
   */
  private createUserWithDefaults(partialData: Partial<User> = {}): User {
    const timestamp = new Date().toISOString();
    const defaultUsername = partialData.username || `recovered_user_${Date.now()}`;
    
    return safeRegistry.initializeUserDataStructures({
      address: partialData.address || `recovered_${Date.now()}`,
      publicKey: partialData.publicKey || '',
      privateKey: partialData.privateKey || '',
      profileId: partialData.profileId || `${defaultUsername}_${Date.now()}`,
      mnemonic: partialData.mnemonic || '',
      username: defaultUsername,
      passwordHash: partialData.passwordHash || 'RECOVERY_REQUIRED',
      password: '',
      salt: partialData.salt || 'RECOVERY_REQUIRED',
      securityCode: partialData.securityCode || '',
      role: partialData.role || 'user',
      balance: partialData.balance || 0,
      usdBalance: partialData.usdBalance || 0,
      stakedBalance: partialData.stakedBalance || 0,
      reputationScore: partialData.reputationScore || 0,
      governanceRank: partialData.governanceRank || '',
      shardsTowardNextQBS: partialData.shardsTowardNextQBS || 0,
      messagingActive: partialData.messagingActive || false,
      messagingExpires: partialData.messagingExpires || '',
      miningActive: partialData.miningActive || false,
      miningExpires: partialData.miningExpires || '',
      autoSignOutMinutes: partialData.autoSignOutMinutes || 30,
      xp: partialData.xp || 0,
      level: partialData.level || 1,
      tagline: partialData.tagline || '',
      bio: partialData.bio || '',
      avatarSeed: partialData.avatarSeed || '',
      discoveryVisible: partialData.discoveryVisible !== undefined ? partialData.discoveryVisible : true,
      activeInitiativeId: partialData.activeInitiativeId || ''
    });
  }

  /**
   * Initialize registry files
   */
  private async initializeRegistryFiles(): Promise<{
    errors: string[];
    warnings: string[];
  }> {
    const result = {
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      const registryFiles = [
        'user-registry.json',
        'founder-registry.json',
        'db-metadata.json',
        'db-access-config.json'
      ];

      for (const file of registryFiles) {
        const filePath = path.join(this.dataBasePath, file);
        
        if (!this.fileExists(filePath)) {
          try {
            await this.createRegistryFile(file);
            result.warnings.push(`Created missing registry file: ${file}`);
          } catch (error) {
            result.errors.push(`Failed to create registry file ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

    } catch (error) {
      result.errors.push(`Registry initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Create registry file with default content
   */
  private async createRegistryFile(fileName: string): Promise<void> {
    const filePath = path.join(this.dataBasePath, fileName);
    let defaultContent: any = {};

    switch (fileName) {
      case 'user-registry.json':
        defaultContent = {
          users: {},
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        };
        break;
      case 'founder-registry.json':
        defaultContent = {
          founders: {},
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        };
        break;
      case 'db-metadata.json':
        defaultContent = {
          version: '1.0.0',
          created: new Date().toISOString(),
          lastMaintenance: new Date().toISOString(),
          totalUsers: 0,
          totalTransactions: 0
        };
        break;
      case 'db-access-config.json':
        defaultContent = {
          maxConnections: 100,
          timeout: 30000,
          retryAttempts: 3,
          backupInterval: 3600000,
          compressionEnabled: true
        };
        break;
    }

    await this.writeJsonFile(filePath, defaultContent);
  }

  /**
   * Create system backup
   */
  private async createSystemBackup(): Promise<{ success: boolean; backupPath?: string }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.backupPath, `system_backup_${timestamp}`);
      
      await this.createDirectory(backupDir);
      
      // Backup user data
      const usersBackupDir = path.join(backupDir, 'users');
      await this.createDirectory(usersBackupDir);
      await this.copyDirectory(path.join(this.dataBasePath, 'users'), usersBackupDir);
      
      // Backup registry files
      const registryFiles = ['user-registry.json', 'founder-registry.json', 'db-metadata.json'];
      for (const file of registryFiles) {
        const sourcePath = path.join(this.dataBasePath, file);
        const destPath = path.join(backupDir, file);
        
        if (this.fileExists(sourcePath)) {
          await this.copyFile(sourcePath, destPath);
        }
      }
      
      // Create backup manifest
      const manifest = {
        created: new Date().toISOString(),
        type: 'system_backup',
        files: await this.getDirectoryContents(backupDir),
        totalSize: await this.getDirectorySize(backupDir)
      };
      
      await this.writeJsonFile(path.join(backupDir, 'manifest.json'), manifest);
      
      return { success: true, backupPath: backupDir };
      
    } catch (error) {
      console.error('System backup failed:', error);
      return { success: false };
    }
  }

  /**
   * Create user backup
   */
  private async createUserBackup(userFile: string, userData: User): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${userFile}_backup_${timestamp}`;
      const backupPath = path.join(this.backupPath, 'users', backupFileName);
      
      await this.writeUserFile(backupPath, userData);
      
    } catch (error) {
      console.warn(`Failed to create backup for user ${userFile}:`, error);
    }
  }

  /**
   * Log recovery action
   */
  private async logRecoveryAction(userFile: string, action: string): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        userFile,
        action,
        details: `Recovery action performed on ${userFile}`
      };
      
      const logPath = path.join(this.dataBasePath, 'recovery', 'logs', 'recovery.log');
      const logContent = JSON.stringify(logEntry) + '\n';
      
      await this.appendToFile(logPath, logContent);
      
    } catch (error) {
      console.warn('Failed to log recovery action:', error);
    }
  }

  /**
   * Generate data integrity report
   */
  public async generateIntegrityReport(): Promise<DataIntegrityReport> {
    const report: DataIntegrityReport = {
      totalUsers: 0,
      validUsers: 0,
      corruptedUsers: 0,
      missingDirectories: [],
      repairedFields: [],
      backupsCreated: 0
    };

    try {
      // Check directory structure
      for (const dir of this.requiredDirectories) {
        const fullPath = path.join(this.dataBasePath, dir);
        if (!this.directoryExists(fullPath)) {
          report.missingDirectories.push(dir);
        }
      }

      // Analyze user data
      const userFiles = await this.getUserFiles();
      report.totalUsers = userFiles.length;

      for (const userFile of userFiles) {
        try {
          const filePath = path.join(this.dataBasePath, 'users', userFile);
          const userData = await this.readUserFile(filePath);
          
          if (userData && safeRegistry.isValidUserStructure(userData)) {
            report.validUsers++;
          } else {
            report.corruptedUsers++;
          }
        } catch (error) {
          report.corruptedUsers++;
        }
      }

      // Count backups
      const backupFiles = await this.getBackupFiles();
      report.backupsCreated = backupFiles.length;

    } catch (error) {
      console.error('Failed to generate integrity report:', error);
    }

    return report;
  }

  // File system helper methods

  private directoryExists(path: string): boolean {
    try {
      return fs.existsSync(path) && fs.statSync(path).isDirectory();
    } catch {
      return false;
    }
  }

  private fileExists(path: string): boolean {
    try {
      return fs.existsSync(path) && fs.statSync(path).isFile();
    } catch {
      return false;
    }
  }

  private async createDirectory(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.mkdir(path, { recursive: true }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async readUserFile(filePath: string): Promise<User | null> {
    try {
      const content = await this.readFileContent(filePath);
      return JSON.parse(content) as User;
    } catch {
      return null;
    }
  }

  private async writeUserFile(filePath: string, userData: User): Promise<void> {
    await this.writeJsonFile(filePath, userData);
  }

  private async readFileContent(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  private async writeJsonFile(filePath: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const content = JSON.stringify(data, null, 2);
      fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async appendToFile(filePath: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.appendFile(filePath, content, 'utf8', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async moveFile(sourcePath: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.rename(sourcePath, destPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async copyFile(sourcePath: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.copyFile(sourcePath, destPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async copyDirectory(sourcePath: string, destPath: string): Promise<void> {
    await this.createDirectory(destPath);
    
    const files = await this.getDirectoryContents(sourcePath);
    
    for (const file of files) {
      const sourceFile = path.join(sourcePath, file);
      const destFile = path.join(destPath, file);
      
      if (this.directoryExists(sourceFile)) {
        await this.copyDirectory(sourceFile, destFile);
      } else {
        await this.copyFile(sourceFile, destFile);
      }
    }
  }

  private async getUserFiles(): Promise<string[]> {
    try {
      const usersDir = path.join(this.dataBasePath, 'users');
      return await this.getDirectoryContents(usersDir);
    } catch {
      return [];
    }
  }

  private async getBackupFiles(): Promise<string[]> {
    try {
      return await this.getDirectoryContents(this.backupPath);
    } catch {
      return [];
    }
  }

  private async getDirectoryContents(dirPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(dirPath, (err, files) => {
        if (err) reject(err);
        else resolve(files);
      });
    });
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    try {
      let totalSize = 0;
      const files = await this.getDirectoryContents(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
      
      return totalSize;
    } catch {
      return 0;
    }
  }
}

// Export singleton instance
export const databaseInitialization = DatabaseInitializationService.getInstance();