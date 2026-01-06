#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates backups of all persistent data
 */

const fs = require('fs');
const path = require('path');

console.log('💾 Creating database backup...');

async function backupDatabase() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const backupDir = path.join(dataDir, 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);

    // Create backup directory
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    // Backup profiles
    const profilesDir = path.join(dataDir, 'profiles');
    if (fs.existsSync(profilesDir)) {
      const profilesBackupDir = path.join(backupPath, 'profiles');
      fs.mkdirSync(profilesBackupDir, { recursive: true });
      
      const profiles = fs.readdirSync(profilesDir);
      profiles.forEach(profile => {
        const sourcePath = path.join(profilesDir, profile);
        const destPath = path.join(profilesBackupDir, profile);
        fs.copyFileSync(sourcePath, destPath);
      });
      console.log(`✅ Backed up ${profiles.length} profiles`);
    }

    // Backup credentials
    const credentialsDir = path.join(dataDir, 'credentials');
    if (fs.existsSync(credentialsDir)) {
      const credentialsBackupDir = path.join(backupPath, 'credentials');
      fs.mkdirSync(credentialsBackupDir, { recursive: true });
      
      const credentials = fs.readdirSync(credentialsDir);
      credentials.forEach(credential => {
        const sourcePath = path.join(credentialsDir, credential);
        const destPath = path.join(credentialsBackupDir, credential);
        fs.copyFileSync(sourcePath, destPath);
      });
      console.log(`✅ Backed up ${credentials.length} credential files`);
    }

    // Backup balances
    const balancesDir = path.join(dataDir, 'balances');
    if (fs.existsSync(balancesDir)) {
      const balancesBackupDir = path.join(backupPath, 'balances');
      fs.mkdirSync(balancesBackupDir, { recursive: true });
      
      const balances = fs.readdirSync(balancesDir);
      balances.forEach(balance => {
        const sourcePath = path.join(balancesDir, balance);
        const destPath = path.join(balancesBackupDir, balance);
        fs.copyFileSync(sourcePath, destPath);
      });
      console.log(`✅ Backed up ${balances.length} balance files`);
    }

    // Backup founder registry
    const founderRegistryPath = path.join(dataDir, 'founder-registry.json');
    if (fs.existsSync(founderRegistryPath)) {
      const destPath = path.join(backupPath, 'founder-registry.json');
      fs.copyFileSync(founderRegistryPath, destPath);
      console.log('✅ Backed up founder registry');
    }

    // Create backup manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      backupPath: backupPath,
      version: '1.0.0',
      contents: {
        profiles: fs.existsSync(path.join(backupPath, 'profiles')),
        credentials: fs.existsSync(path.join(backupPath, 'credentials')),
        balances: fs.existsSync(path.join(backupPath, 'balances')),
        founderRegistry: fs.existsSync(path.join(backupPath, 'founder-registry.json'))
      }
    };

    const manifestPath = path.join(backupPath, 'backup-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log('🎉 Database backup completed successfully');
    console.log(`📁 Backup location: ${backupPath}`);
    
    return backupPath;
  } catch (error) {
    console.error('❌ Database backup failed:', error.message);
    process.exit(1);
  }
}

// Run backup
backupDatabase();