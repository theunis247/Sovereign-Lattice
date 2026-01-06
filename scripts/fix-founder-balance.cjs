#!/usr/bin/env node
/**
 * Fix Founder Balance Script
 * Ensures founder balance is correctly set to 1000 QBS
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing founder balance...');

async function fixFounderBalance() {
  try {
    // Path to founder user file
    const userFile = path.join('data', 'users', '0xd3d9dbc928c765d19fef1da0bb4df83736975730.json');
    
    if (fs.existsSync(userFile)) {
      // Read current user data
      const userData = JSON.parse(fs.readFileSync(userFile, 'utf8'));
      
      console.log('📊 Current founder data:');
      console.log('   Username:', userData.username);
      console.log('   Current Balance:', userData.balance);
      console.log('   Current USD Balance:', userData.usdBalance);
      
      // Ensure balance is exactly 1000
      const updatedUserData = {
        ...userData,
        balance: 1000,
        usdBalance: 1000000, // 1 million quarks
        lastModified: new Date().toISOString(),
        isFounder: true,
        role: 'admin',
        verified: true
      };
      
      // Save updated data
      fs.writeFileSync(userFile, JSON.stringify(updatedUserData, null, 2));
      
      console.log('✅ Founder balance updated:');
      console.log('   New Balance:', updatedUserData.balance, 'QBS');
      console.log('   New USD Balance:', updatedUserData.usdBalance, 'Quarks');
      console.log('   Is Founder:', updatedUserData.isFounder);
      console.log('   Role:', updatedUserData.role);
      
      // Also update the profile file if it exists
      const profileFile = path.join('data', 'profiles', 'founder_freedom247365.json');
      if (fs.existsSync(profileFile)) {
        const profileData = JSON.parse(fs.readFileSync(profileFile, 'utf8'));
        profileData.qbsBalance = 1000;
        profileData.balance = 1000;
        profileData.lastModified = new Date().toISOString();
        fs.writeFileSync(profileFile, JSON.stringify(profileData, null, 2));
        console.log('✅ Founder profile also updated');
      }
      
      console.log('\n🎉 Founder balance fix completed!');
      console.log('\n📋 Next steps:');
      console.log('   1. Clear browser localStorage: localStorage.clear()');
      console.log('   2. Refresh the application');
      console.log('   3. Login with: Freedom24/7365 / Security Code: 77777');
      console.log('   4. Balance should now show 1000.000000 QBS');
      
    } else {
      console.log('❌ Founder user file not found. Creating new founder...');
      
      // Create new founder user
      const newFounderData = {
        address: '0xd3d9dbc928c765d19fef1da0bb4df83736975730',
        publicKey: 'qbs1qpxr9y7g9dw0sn54kce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lw2p',
        privateKey: 'LATTICE-PRV-FOUNDER-GENESIS-KEY-7777-BETA-PRIME-SHARD-Z-11113NOU',
        profileId: 'founder_freedom247365',
        username: 'Freedom24/7365',
        passwordHash: 'hashed_password_here',
        password: 'LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU',
        salt: 'founder_salt_7777',
        securityCode: '77777',
        role: 'admin',
        balance: 1000,
        usdBalance: 1000000,
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
        shardsTowardNextQBS: 0,
        messagingActive: true,
        miningActive: true,
        xp: 0,
        level: 1,
        tagline: 'Sovereign Lattice Founder',
        bio: 'Genesis node of the Sovereign Lattice Protocol',
        created: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: 1,
        isLocked: false,
        isFounder: true,
        verified: true
      };
      
      // Ensure users directory exists
      const usersDir = path.join('data', 'users');
      if (!fs.existsSync(usersDir)) {
        fs.mkdirSync(usersDir, { recursive: true });
      }
      
      // Save new founder
      fs.writeFileSync(userFile, JSON.stringify(newFounderData, null, 2));
      console.log('✅ New founder user created with 1000 QBS balance');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

fixFounderBalance();