#!/usr/bin/env node

/**
 * Database Initialization Script
 * Ensures database is properly initialized with persistent storage
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Initializing database for persistent storage...');

async function initializeDatabase() {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ Created data directory');
    }

    // Create backup directory
    const backupDir = path.join(dataDir, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('✅ Created backup directory');
    }

    // Create logs directory
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log('✅ Created logs directory');
    }

    // Initialize database metadata
    const dbMetadata = {
      initialized: new Date().toISOString(),
      version: '1.0.0',
      persistent: true,
      backupEnabled: true
    };

    const metadataPath = path.join(dataDir, 'db-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(dbMetadata, null, 2));
    console.log('✅ Database metadata initialized');

    // Create environment-specific configuration
    const envConfig = {
      NODE_ENV: process.env.NODE_ENV || 'production',
      DATABASE_PERSISTENT: 'true',
      BACKUP_ENABLED: 'true',
      DATA_DIRECTORY: dataDir,
      LOGS_DIRECTORY: logsDir
    };

    // Write .env file if it doesn't exist
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      const envContent = Object.entries(envConfig)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Environment configuration created');
    }

    console.log('🎉 Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();