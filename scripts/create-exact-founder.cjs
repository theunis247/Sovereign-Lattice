#!/usr/bin/env node
/**
 * Create Exact Founder Profile
 * Creates founder with exact username matching the login attempt
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('👑 Creating exact founder profile...');

async function createExactFounder() {
  try {
    // Ensure directories exist
    const dataDir = 'data';
    const usersDir = path.join(dataDir, 'users');
    
    if (!fs.existsSync(usersDir)) {
      fs.mkdirSync(usersDir, { recursive: true });
    }

    // Create founder with exact matching credentials
    const founderData = {
      // Core identity
      address: '0xd3d9dbc928c765d19fef1da0bb4df83736975730',
      publicKey: 'qbs1qpxr9y7g9dw0sn54kce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lw2p',
      privateKey: 'LATTICE-PRV-FOUNDER-GENESIS-KEY-7777-BETA-PRIME-SHARD-Z-11113NOU',
      
      // Profile
      profileId: 'founder_freedom247365',
      username: 'Freedom24/7365',
      
      // Authentication - using simple hash to avoid crypto issues
      passwordHash: crypto.createHash('sha256').update('LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU').digest('hex'),
      password: 'LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU', // Store plain for compatibility
      salt: 'founder_salt_7777',
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
        id: 'TX-GENESIS-FOUNDER',
        timestamp: new Date().toISOString(),
        type: 'CREDIT',
        amount: '1000',
        unit: 'QBS',
        description: 'Genesis Founder Allocation'
      }],
      incidents: [],
      solvedBlocks: [],
      ownedNfts: [],
      
      // Mining and messaging
      shardsTowardNextQBS: 0,
      messagingActive: true,
      miningActive: true,
      
      // Experience
      xp: 0,
      level: 1,
      
      // Profile info
      tagline: 'Sovereign Lattice Founder',
      bio: 'Genesis node of the Sovereign Lattice Protocol',
      
      // Timestamps
      created: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: 1,
      isLocked: false,
      
      // Mnemonic for recovery
      mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'
    };

    // Save founder user
    const founderPath = path.join(usersDir, `${founderData.address}.json`);
    fs.writeFileSync(founderPath, JSON.stringify(founderData, null, 2));
    
    console.log('✅ Exact founder profile created');
    console.log('   Username:', founderData.username);
    console.log('   Address:', founderData.address);
    console.log('   Balance:', founderData.balance, 'QBS');
    console.log('   Security Code:', founderData.securityCode);
    
    // Also create with username as key for lookup
    const usernameKey = founderData.username.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const usernamePath = path.join(usersDir, `${usernameKey}.json`);
    fs.writeFileSync(usernamePath, JSON.stringify(founderData, null, 2));
    
    console.log('✅ Username lookup file created:', usernameKey);
    
    // Create database metadata
    const metadataPath = path.join(dataDir, 'db-metadata.json');
    const metadata = {
      initialized: true,
      version: '1.0.0',
      founderCreated: true,
      founderUsername: founderData.username,
      founderAddress: founderData.address,
      totalUsers: 1,
      created: new Date().toISOString()
    };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log('✅ Database metadata created');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create founder:', error.message);
    return false;
  }
}

createExactFounder();