#!/usr/bin/env node
/**
 * Emergency Lockout Bypass
 * Immediately clears lockout and ensures founder can login
 */

console.log('🚨 EMERGENCY LOCKOUT BYPASS ACTIVATED');

// Instructions for immediate bypass
console.log('\n🔓 IMMEDIATE LOCKOUT BYPASS:');
console.log('');
console.log('1. Open Browser Developer Tools (F12)');
console.log('2. Go to Console tab');
console.log('3. Copy and paste this EXACT command:');
console.log('');
console.log('   localStorage.clear(); sessionStorage.clear(); location.reload();');
console.log('');
console.log('4. Press Enter');
console.log('5. Page will reload with NO lockout');
console.log('');

console.log('🎯 AFTER BYPASS - USE THESE EXACT CREDENTIALS:');
console.log('');
console.log('   Username: Freedom24/7365');
console.log('   Password: LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU');
console.log('   Security Code: 77777');
console.log('');

// Verify database files exist
const fs = require('fs');
const path = require('path');

console.log('📊 DATABASE VERIFICATION:');

const founderPath = path.join('data', 'users', '0xd3d9dbc928c765d19fef1da0bb4df83736975730.json');
if (fs.existsSync(founderPath)) {
  const founder = JSON.parse(fs.readFileSync(founderPath, 'utf8'));
  console.log('✅ Founder exists in database');
  console.log('   Username:', founder.username);
  console.log('   Balance:', founder.balance, 'QBS');
  console.log('   Security Code:', founder.securityCode);
} else {
  console.log('❌ Founder missing - creating now...');
  
  // Create founder immediately
  const founderData = {
    address: '0xd3d9dbc928c765d19fef1da0bb4df83736975730',
    publicKey: 'qbs1qpxr9y7g9dw0sn54kce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lw2p',
    privateKey: 'LATTICE-PRV-FOUNDER-KEY',
    profileId: 'founder_freedom247365',
    username: 'Freedom24/7365',
    password: 'LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU',
    passwordHash: 'founder_hash_7777',
    salt: 'founder_salt',
    securityCode: '77777',
    role: 'admin',
    balance: 1000,
    usdBalance: 1000000,
    contacts: [],
    transactions: [],
    incidents: [],
    solvedBlocks: [],
    ownedNfts: [],
    shardsTowardNextQBS: 0,
    messagingActive: true,
    miningActive: true,
    xp: 0,
    level: 1,
    tagline: 'Founder',
    bio: 'Genesis Node',
    created: new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: 1,
    isLocked: false,
    isFounder: true,
    verified: true,
    mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'
  };
  
  // Ensure directory exists
  const usersDir = path.dirname(founderPath);
  if (!fs.existsSync(usersDir)) {
    fs.mkdirSync(usersDir, { recursive: true });
  }
  
  fs.writeFileSync(founderPath, JSON.stringify(founderData, null, 2));
  console.log('✅ Emergency founder created');
}

console.log('');
console.log('⚡ EMERGENCY PROCEDURE COMPLETE');
console.log('');
console.log('🔄 NEXT STEPS:');
console.log('1. Clear browser storage (command above)');
console.log('2. Login with exact credentials shown');
console.log('3. Should work immediately with 1000 QBS balance');
console.log('');