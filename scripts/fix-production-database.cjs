#!/usr/bin/env node
/**
 * Fix Production Database
 * Ensures production database is properly initialized on hosted server
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing production database for hosted server...');

async function fixProductionDatabase() {
  try {
    // Step 1: Create production environment configuration
    console.log('\n1️⃣ Setting up production environment...');
    
    const envConfig = {
      NODE_ENV: 'production',
      DATABASE_PERSISTENT: 'true',
      DB_TYPE: 'file-based',
      FOUNDER_INITIALIZED: 'true'
    };
    
    // Create .env file for production
    const envContent = Object.entries(envConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync('.env', envContent);
    console.log('✅ Production environment configured');
    
    // Step 2: Initialize production database structure
    console.log('\n2️⃣ Initializing production database structure...');
    
    const dataDir = 'data';
    const requiredDirs = [
      'data/users',
      'data/profiles', 
      'data/credentials',
      'data/transactions',
      'data/backups',
      'logs'
    ];
    
    requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   ✅ Created ${dir}`);
      }
    });
    
    // Step 3: Create production founder profile
    console.log('\n3️⃣ Creating production founder profile...');
    
    const founderData = {
      // Core identity
      address: '0xd3d9dbc928c765d19fef1da0bb4df83736975730',
      publicKey: 'qbs1qpxr9y7g9dw0sn54kce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lw2p',
      privateKey: 'LATTICE-PRV-FOUNDER-GENESIS-KEY-7777-BETA-PRIME-SHARD-Z-11113NOU',
      
      // Profile
      profileId: 'founder_freedom247365',
      username: 'Freedom24/7365',
      
      // Authentication
      password: 'LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU',
      passwordHash: 'production_founder_hash_7777',
      salt: 'production_founder_salt',
      securityCode: '77777',
      
      // Role and permissions
      role: 'admin',
      isFounder: true,
      verified: true,
      
      // Balances
      balance: 1000,
      usdBalance: 1000000,
      stakedBalance: 0,
      
      // Collections
      contacts: [],
      transactions: [{
        id: 'TX-GENESIS-FOUNDER-PROD',
        timestamp: new Date().toISOString(),
        type: 'CREDIT',
        amount: '1000',
        unit: 'QBS',
        description: 'Production Genesis Founder Allocation'
      }],
      incidents: [],
      solvedBlocks: [],
      ownedNfts: [],
      
      // Settings
      shardsTowardNextQBS: 0,
      messagingActive: true,
      miningActive: true,
      xp: 0,
      level: 1,
      tagline: 'Sovereign Lattice Founder',
      bio: 'Production Genesis Node',
      
      // Timestamps
      created: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: 1,
      isLocked: false,
      
      // Recovery
      mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'
    };
    
    // Save founder to users directory
    const founderPath = path.join('data', 'users', `${founderData.address}.json`);
    fs.writeFileSync(founderPath, JSON.stringify(founderData, null, 2));
    console.log('✅ Production founder created in users directory');
    
    // Save founder to profiles directory
    const profilePath = path.join('data', 'profiles', `${founderData.profileId}.json`);
    fs.writeFileSync(profilePath, JSON.stringify(founderData, null, 2));
    console.log('✅ Production founder created in profiles directory');
    
    // Create username lookup
    const usernameLookup = founderData.username.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const lookupPath = path.join('data', 'users', `${usernameLookup}.json`);
    fs.writeFileSync(lookupPath, JSON.stringify(founderData, null, 2));
    console.log('✅ Username lookup file created');
    
    // Step 4: Create production database metadata
    console.log('\n4️⃣ Creating production database metadata...');
    
    const metadata = {
      initialized: true,
      version: '1.0.0',
      environment: 'production',
      databaseType: 'file-based',
      founderCreated: true,
      founderUsername: founderData.username,
      founderAddress: founderData.address,
      totalUsers: 1,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(path.join('data', 'db-metadata.json'), JSON.stringify(metadata, null, 2));
    console.log('✅ Database metadata created');
    
    // Step 5: Create user registry
    const registry = {
      users: [founderData.profileId],
      totalUsers: 1,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(path.join('data', 'user-registry.json'), JSON.stringify(registry, null, 2));
    console.log('✅ User registry created');
    
    // Step 6: Create database access configuration
    const accessConfig = {
      type: 'file-based',
      persistent: true,
      backupEnabled: true,
      encryptionEnabled: false, // Simplified for production
      initialized: true,
      founderExists: true,
      created: new Date().toISOString()
    };
    
    fs.writeFileSync(path.join('data', 'db-access-config.json'), JSON.stringify(accessConfig, null, 2));
    console.log('✅ Database access configuration created');
    
    console.log('\n🎉 Production database setup completed!');
    console.log('\n📋 Production Deployment Summary:');
    console.log('   ✅ Environment configured for production');
    console.log('   ✅ File-based database initialized');
    console.log('   ✅ Founder profile created with 1000 QBS');
    console.log('   ✅ All required directories created');
    console.log('   ✅ Database metadata and registry configured');
    console.log('');
    console.log('🔐 Production Login Credentials:');
    console.log('   Username: Freedom24/7365');
    console.log('   Password: LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU');
    console.log('   Security Code: 77777');
    console.log('   Balance: 1000 QBS');
    console.log('');
    console.log('🚀 Ready for production deployment!');
    console.log('   Upload all files including the data/ directory to your server');
    console.log('   The application will now use file-based storage instead of IndexedDB');
    
    return true;
    
  } catch (error) {
    console.error('❌ Production database setup failed:', error.message);
    return false;
  }
}

fixProductionDatabase();