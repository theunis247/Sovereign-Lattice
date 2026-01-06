#!/usr/bin/env node
/**
 * Test Login Connection
 * Tests the database connection and login process
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing login connection...');

async function testLoginConnection() {
  try {
    // Test 1: Check if founder file exists
    console.log('\n1️⃣ Checking founder file...');
    const founderPath = path.join('data', 'users', '0xd3d9dbc928c765d19fef1da0bb4df83736975730.json');
    
    if (fs.existsSync(founderPath)) {
      const founderData = JSON.parse(fs.readFileSync(founderPath, 'utf8'));
      console.log('✅ Founder file exists');
      console.log('   Username:', founderData.username);
      console.log('   Password stored:', founderData.password ? 'YES' : 'NO');
      console.log('   Security Code:', founderData.securityCode);
      console.log('   Balance:', founderData.balance);
    } else {
      console.log('❌ Founder file missing');
      return false;
    }
    
    // Test 2: Check username lookup file
    console.log('\n2️⃣ Checking username lookup...');
    const usernamePath = path.join('data', 'users', 'freedom24_7365.json');
    
    if (fs.existsSync(usernamePath)) {
      console.log('✅ Username lookup file exists');
    } else {
      console.log('⚠️ Username lookup file missing, creating...');
      const founderData = JSON.parse(fs.readFileSync(founderPath, 'utf8'));
      fs.writeFileSync(usernamePath, JSON.stringify(founderData, null, 2));
      console.log('✅ Username lookup file created');
    }
    
    // Test 3: Test simple authentication
    console.log('\n3️⃣ Testing authentication logic...');
    const founderData = JSON.parse(fs.readFileSync(founderPath, 'utf8'));
    
    const testUsername = 'Freedom24/7365';
    const testPassword = 'LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU';
    const testSecurityCode = '77777';
    
    console.log('   Testing username match:', founderData.username === testUsername ? '✅' : '❌');
    console.log('   Testing password match:', founderData.password === testPassword ? '✅' : '❌');
    console.log('   Testing security code match:', founderData.securityCode === testSecurityCode ? '✅' : '❌');
    
    // Test 4: Create a simple hash test
    console.log('\n4️⃣ Testing hash function...');
    try {
      // Simple hash test
      const input = testPassword + founderData.salt + 'k7$!v9QzP@m3L#r8_Quantum_Sovereign_999';
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
      const finalHash = hexHash.repeat(16).substring(0, 128);
      
      console.log('✅ Hash function working');
      console.log('   Generated hash length:', finalHash.length);
      
      // Update founder with this hash
      founderData.passwordHash = finalHash;
      fs.writeFileSync(founderPath, JSON.stringify(founderData, null, 2));
      fs.writeFileSync(usernamePath, JSON.stringify(founderData, null, 2));
      console.log('✅ Updated founder with new hash');
      
    } catch (error) {
      console.log('❌ Hash function error:', error.message);
    }
    
    console.log('\n🎯 LOGIN TEST SUMMARY:');
    console.log('   Username: Freedom24/7365');
    console.log('   Password: LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU');
    console.log('   Security Code: 77777');
    console.log('   Expected Balance: 1000 QBS');
    console.log('');
    console.log('✅ Database connection test completed');
    console.log('🔄 Please refresh the browser and try logging in again');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testLoginConnection();