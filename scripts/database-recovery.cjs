#!/usr/bin/env node

/**
 * Database Recovery CLI Script
 * Provides command-line interface for database initialization and recovery operations
 */

const fs = require('fs');
const path = require('path');

// Simple CLI argument parser
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    command: 'help',
    force: false,
    backup: true,
    repair: true,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      options.command = 'help';
      break;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--no-backup') {
      options.backup = false;
    } else if (arg === '--no-repair') {
      options.repair = false;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (!arg.startsWith('-')) {
      options.command = arg;
    }
  }

  return options;
}

// Display help information
function showHelp() {
  console.log(`
Database Recovery CLI Tool

Usage: node database-recovery.cjs [command] [options]

Commands:
  init          Initialize database with recovery
  health        Check database health
  repair        Quick repair of common issues
  backup        Create emergency backup
  validate      Validate all users
  stats         Show database statistics
  emergency     Force emergency recovery
  cleanup       Clean up old backups
  help          Show this help message

Options:
  --force, -f       Force operation without confirmation
  --no-backup       Skip backup creation
  --no-repair       Skip automatic repair
  --verbose, -v     Enable verbose output

Examples:
  node database-recovery.cjs init --verbose
  node database-recovery.cjs health
  node database-recovery.cjs repair --force
  node database-recovery.cjs backup
  node database-recovery.cjs emergency --force
`);
}

// Log with timestamp
function log(message, verbose = false) {
  if (!verbose || options.verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

// Error logging
function logError(message) {
  console.error(`[ERROR] ${message}`);
}

// Success logging
function logSuccess(message) {
  console.log(`[SUCCESS] ${message}`);
}

// Warning logging
function logWarning(message) {
  console.warn(`[WARNING] ${message}`);
}

// Confirm action with user
function confirmAction(message) {
  if (options.force) {
    return true;
  }

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Check if we're in the right directory
function checkEnvironment() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const dataPath = path.join(process.cwd(), 'data');
  
  if (!fs.existsSync(packageJsonPath)) {
    logError('package.json not found. Please run this script from the project root directory.');
    process.exit(1);
  }

  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataPath)) {
    log('Creating data directory...');
    fs.mkdirSync(dataPath, { recursive: true });
  }
}

// Initialize database
async function initializeDatabase() {
  log('Starting database initialization...');
  
  try {
    // Dynamic import to handle ES modules
    const { databaseUtils } = await import('../services/databaseUtils.js');
    
    const result = await databaseUtils.initializeDatabase({
      createMissingDirectories: true,
      repairCorruptedData: options.repair,
      validateAllUsers: true,
      createBackups: options.backup,
      forceDefaults: false
    });

    if (result.success) {
      logSuccess('Database initialization completed successfully');
      
      if (result.createdDirectories.length > 0) {
        log(`Created directories: ${result.createdDirectories.join(', ')}`);
      }
      
      if (result.repairedUsers.length > 0) {
        log(`Repaired users: ${result.repairedUsers.length}`);
      }
      
      if (result.recoveredData.length > 0) {
        log(`Recovered data items: ${result.recoveredData.length}`);
      }
      
      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => logWarning(warning));
      }
    } else {
      logError('Database initialization failed');
      result.errors.forEach(error => logError(error));
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Initialization failed: ${error.message}`);
    process.exit(1);
  }
}

// Check database health
async function checkHealth() {
  log('Checking database health...');
  
  try {
    const { databaseUtils } = await import('../services/databaseUtils.js');
    
    const health = await databaseUtils.performHealthCheck();
    
    if (health.isHealthy) {
      logSuccess('Database is healthy');
    } else {
      logWarning('Database has issues');
    }
    
    console.log('\nHealth Report:');
    console.log(`- Total Users: ${health.metrics.totalUsers}`);
    console.log(`- Valid Users: ${health.metrics.validUsers}`);
    console.log(`- Corrupted Users: ${health.metrics.corruptedUsers}`);
    console.log(`- Missing Directories: ${health.metrics.missingDirectories}`);
    console.log(`- Available Backups: ${health.metrics.availableBackups}`);
    
    if (health.issues.length > 0) {
      console.log('\nIssues:');
      health.issues.forEach(issue => console.log(`- ${issue}`));
    }
    
    if (health.recommendations.length > 0) {
      console.log('\nRecommendations:');
      health.recommendations.forEach(rec => console.log(`- ${rec}`));
    }
    
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    process.exit(1);
  }
}

// Quick repair
async function quickRepair() {
  const confirmed = await confirmAction('This will attempt to repair database issues. Continue?');
  if (!confirmed) {
    log('Operation cancelled');
    return;
  }
  
  log('Starting quick repair...');
  
  try {
    const { databaseUtils } = await import('../services/databaseUtils.js');
    
    const result = await databaseUtils.quickRepair();
    
    if (result.success) {
      logSuccess('Quick repair completed successfully');
      
      if (result.repairedItems.length > 0) {
        console.log('\nRepaired items:');
        result.repairedItems.forEach(item => console.log(`- ${item}`));
      }
    } else {
      logError('Quick repair failed');
      result.errors.forEach(error => logError(error));
    }
    
    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(warning => logWarning(warning));
    }
    
  } catch (error) {
    logError(`Quick repair failed: ${error.message}`);
    process.exit(1);
  }
}

// Create backup
async function createBackup() {
  log('Creating emergency backup...');
  
  try {
    const { databaseUtils } = await import('../services/databaseUtils.js');
    
    const result = await databaseUtils.createEmergencyBackup();
    
    if (result.success) {
      logSuccess(`Backup created successfully: ${result.backupPath}`);
    } else {
      logError(`Backup failed: ${result.error}`);
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Backup creation failed: ${error.message}`);
    process.exit(1);
  }
}

// Validate all users
async function validateUsers() {
  log('Validating all users...');
  
  try {
    const { databaseUtils } = await import('../services/databaseUtils.js');
    
    const result = await databaseUtils.validateAllUsers();
    
    console.log('\nValidation Results:');
    console.log(`- Total Users: ${result.totalUsers}`);
    console.log(`- Valid Users: ${result.validUsers}`);
    console.log(`- Repaired Users: ${result.repairedUsers}`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(error => logError(error));
    } else {
      logSuccess('All users validated successfully');
    }
    
  } catch (error) {
    logError(`User validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Show database statistics
async function showStats() {
  log('Gathering database statistics...');
  
  try {
    const { databaseUtils } = await import('../services/databaseUtils.js');
    
    const stats = await databaseUtils.getDatabaseStatistics();
    
    console.log('\nDatabase Statistics:');
    console.log(`- Total Users: ${stats.totalUsers}`);
    console.log(`- Valid Users: ${stats.validUsers}`);
    console.log(`- Corrupted Users: ${stats.corruptedUsers}`);
    console.log(`- Total Transactions: ${stats.totalTransactions}`);
    console.log(`- Total Backups: ${stats.totalBackups}`);
    console.log(`- Database Size: ${stats.databaseSize}`);
    console.log(`- Last Maintenance: ${stats.lastMaintenance || 'Never'}`);
    
  } catch (error) {
    logError(`Failed to get statistics: ${error.message}`);
    process.exit(1);
  }
}

// Force emergency recovery
async function emergencyRecovery() {
  const confirmed = await confirmAction('This will perform emergency recovery. This should only be used when the database is severely corrupted. Continue?');
  if (!confirmed) {
    log('Operation cancelled');
    return;
  }
  
  log('Starting emergency recovery...');
  
  try {
    const { databaseUtils } = await import('../services/databaseUtils.js');
    
    const result = await databaseUtils.forceEmergencyRecovery();
    
    if (result.success) {
      logSuccess('Emergency recovery completed successfully');
    } else {
      logError('Emergency recovery failed');
      result.errors.forEach(error => logError(error));
    }
    
    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(warning => logWarning(warning));
    }
    
  } catch (error) {
    logError(`Emergency recovery failed: ${error.message}`);
    process.exit(1);
  }
}

// Clean up old backups
async function cleanupBackups() {
  const confirmed = await confirmAction('This will delete old backups (keeping the 10 most recent). Continue?');
  if (!confirmed) {
    log('Operation cancelled');
    return;
  }
  
  log('Cleaning up old backups...');
  
  try {
    const { databaseUtils } = await import('../services/databaseUtils.js');
    
    const result = await databaseUtils.cleanupOldBackups(10);
    
    if (result.success) {
      logSuccess(`Cleanup completed. Deleted ${result.deletedCount} old backups`);
    } else {
      logError('Cleanup failed');
      result.errors.forEach(error => logError(error));
    }
    
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const options = parseArgs();
  global.options = options; // Make options available globally
  
  if (options.verbose) {
    log('Starting database recovery CLI tool...');
  }
  
  checkEnvironment();
  
  switch (options.command) {
    case 'init':
      await initializeDatabase();
      break;
    case 'health':
      await checkHealth();
      break;
    case 'repair':
      await quickRepair();
      break;
    case 'backup':
      await createBackup();
      break;
    case 'validate':
      await validateUsers();
      break;
    case 'stats':
      await showStats();
      break;
    case 'emergency':
      await emergencyRecovery();
      break;
    case 'cleanup':
      await cleanupBackups();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run the CLI
main().catch((error) => {
  logError(`CLI execution failed: ${error.message}`);
  process.exit(1);
});