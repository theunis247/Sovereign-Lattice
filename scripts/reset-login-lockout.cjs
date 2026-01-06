#!/usr/bin/env node
/**
 * Reset Login Lockout Script
 * Clears browser localStorage to reset failed login attempts
 */

console.log('🔓 Resetting login lockout...');

// Instructions for manual reset
console.log('\n📋 LOCKOUT RESET INSTRUCTIONS:');
console.log('');
console.log('1. Open browser Developer Tools (F12)');
console.log('2. Go to Console tab');
console.log('3. Paste this command and press Enter:');
console.log('');
console.log('   localStorage.clear(); sessionStorage.clear(); location.reload();');
console.log('');
console.log('4. Wait for page to reload');
console.log('5. Try logging in again with founder credentials');
console.log('');

// Show correct founder credentials
console.log('🔐 CORRECT FOUNDER CREDENTIALS:');
console.log('');
console.log('   Username: Freedom24/7365');
console.log('   Password: LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU');
console.log('   Security Code: 77777');
console.log('');

// Alternative: Wait for lockout to expire
console.log('⏰ ALTERNATIVE: Wait for lockout to expire (60 seconds total)');
console.log('');

// Check if founder exists in database
const fs = require('fs');
const path = require('path');

const userFile = path.join('data', 'users', '0xd3d9dbc928c765d19fef1da0bb4df83736975730.json');
if (fs.existsSync(userFile)) {
  const userData = JSON.parse(fs.readFileSync(userFile, 'utf8'));
  console.log('✅ FOUNDER VERIFICATION:');
  console.log(`   Username in DB: ${userData.username}`);
  console.log(`   Balance in DB: ${userData.balance} QBS`);
  console.log(`   Security Code in DB: ${userData.securityCode}`);
  console.log(`   Password matches: ${userData.password === 'LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU' ? 'YES' : 'NO'}`);
} else {
  console.log('❌ Founder user not found in database');
}

console.log('');
console.log('🎯 AFTER RESET:');
console.log('   1. Login should work immediately');
console.log('   2. Balance should show 1000.000000 QBS');
console.log('   3. No more lockout message');
console.log('');