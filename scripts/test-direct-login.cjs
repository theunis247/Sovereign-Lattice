#!/usr/bin/env node
/**
 * Test Direct Login
 * Simulates the exact login process to identify issues
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing direct login process...');

async function testDirectLogin() {
  try {
    // Simulate getUserByIdentifier function
    console.log('\n1️⃣ Testing getUserByIdentifier...');
    
    const usersDir = path.join('data', 'users');
    const files = fs.readdirSync(usersDir);
    
    const searchUsername = 'Freedom24/7365';
    let foundUser = null;
    
    console.log('   Searching for username:', searchUsername);
    console.log('   Available files:', files);
    
    // Search through all user files
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(usersDir, file);
        const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        console.log(`   Checking file ${file}:`);
        console.log(`     Username: "${userData.username}"`);
        console.log(`     Match: ${userData.username === searchUsername}`);
        
        if (userData.username === searchUsername || 
            userData.username.toLowerCase() === searchUsername.toLowerCase() ||
            userData.address === searchUsername ||
            userData.profileId === searchUsername) {
          foundUser = userData;
          console.log('   ✅ FOUND USER!');
          break;
        }
      }
    }
    
    if (!foundUser) {
      console.log('   ❌ USER NOT FOUND');
      return false;
    }
    
    // Test password verification
    console.log('\n2️⃣ Testing password verification...');
    const testPassword = 'LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU';
    
    console.log('   Stored password:', foundUser.password);
    console.log('   Test password:', testPassword);
    console.log('   Password match:', foundUser.password === testPassword ? '✅' : '❌');
    
    // Test security code
    console.log('\n3️⃣ Testing security code...');
    const testSecurityCode = '77777';
    
    console.log('   Stored security code:', foundUser.securityCode);
    console.log('   Test security code:', testSecurityCode);
    console.log('   Security code match:', foundUser.securityCode === testSecurityCode ? '✅' : '❌');
    
    // Test balance
    console.log('\n4️⃣ Testing balance...');
    console.log('   Balance:', foundUser.balance);
    console.log('   Balance type:', typeof foundUser.balance);
    console.log('   USD Balance:', foundUser.usdBalance);
    
    console.log('\n✅ DIRECT LOGIN TEST RESULTS:');
    console.log('   User Found:', foundUser ? 'YES' : 'NO');
    console.log('   Password Valid:', foundUser && foundUser.password === testPassword ? 'YES' : 'NO');
    console.log('   Security Code Valid:', foundUser && foundUser.securityCode === testSecurityCode ? 'YES' : 'NO');
    console.log('   Balance Available:', foundUser && foundUser.balance > 0 ? 'YES' : 'NO');
    
    if (foundUser && foundUser.password === testPassword && foundUser.securityCode === testSecurityCode) {
      console.log('\n🎉 LOGIN SHOULD WORK!');
      console.log('   Expected result: Login successful with', foundUser.balance, 'QBS');
    } else {
      console.log('\n❌ LOGIN WILL FAIL');
      console.log('   Issue: User lookup or credential mismatch');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testDirectLogin();