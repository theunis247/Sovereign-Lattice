#!/usr/bin/env node
/**
 * Debug Founder Balance Script
 * Checks founder balance and login process
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging founder balance issue...\n');

async function debugFounderBalance() {
  try {
    // Check founder user data
    const userFile = path.join('data', 'users', '0xd3d9dbc928c765d19fef1da0bb4df83736975730.json');
    if (fs.existsSync(userFile)) {
      const userData = JSON.parse(fs.readFileSync(userFile, 'utf8'));
      
      console.log('📊 FOUNDER USER DATA:');
      console.log('   Username:', userData.username);
      console.log('   Balance (QBS):', userData.balance);
      console.log('   USD Balance:', userData.usdBalance);
      console.log('   Balance Type:', typeof userData.balance);
      console.log('   Balance as String:', userData.balance.toString());
      console.log('   Balance Fixed(6):', userData.balance.toFixed(6));
      console.log('   Address:', userData.address);
      console.log('   Security Code:', userData.securityCode);
      console.log('   Is Founder:', userData.isFounder);
      console.log('   Role:', userData.role);
      console.log('');
      
      // Check if balance is being displayed correctly
      console.log('🎯 BALANCE DISPLAY TESTS:');
      console.log('   Raw balance:', userData.balance);
      console.log('   Formatted (6 decimals):', userData.balance.toFixed(6));
      console.log('   As currency:', new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 6 
      }).format(userData.balance));
      console.log('   Scientific notation:', userData.balance.toExponential());
      console.log('');
      
      // Check for potential issues
      console.log('⚠️  POTENTIAL ISSUES CHECK:');
      if (userData.balance === 0) {
        console.log('   ❌ Balance is zero!');
      } else if (userData.balance < 0.000001) {
        console.log('   ⚠️  Balance is very small (less than 0.000001)');
      } else if (userData.balance > 1000000) {
        console.log('   ⚠️  Balance is very large (more than 1,000,000)');
      } else {
        console.log('   ✅ Balance appears normal');
      }
      
      if (typeof userData.balance !== 'number') {
        console.log('   ❌ Balance is not a number! Type:', typeof userData.balance);
      } else {
        console.log('   ✅ Balance is a number');
      }
      
      if (isNaN(userData.balance)) {
        console.log('   ❌ Balance is NaN!');
      } else {
        console.log('   ✅ Balance is not NaN');
      }
      
    } else {
      console.log('❌ Founder user file not found at:', userFile);
    }
    
    // Check if there are multiple user files
    console.log('📁 ALL USER FILES:');
    const usersDir = path.join('data', 'users');
    if (fs.existsSync(usersDir)) {
      const files = fs.readdirSync(usersDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(usersDir, file);
          const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          console.log(`   ${file}: ${userData.username} - Balance: ${userData.balance}`);
        }
      });
    }
    
    // Check localStorage simulation
    console.log('\n💾 LOCALSTORAGE SIMULATION:');
    const activeAddr = '0xd3d9dbc928c765d19fef1da0bb4df83736975730';
    console.log('   LATTICE_ACTIVE_ADDR would be:', activeAddr);
    
    // Test balance formatting functions
    console.log('\n🧮 BALANCE FORMATTING TESTS:');
    const testBalance = 1000;
    console.log('   Test balance:', testBalance);
    console.log('   .toFixed(6):', testBalance.toFixed(6));
    console.log('   .toLocaleString():', testBalance.toLocaleString());
    console.log('   String():', String(testBalance));
    console.log('   JSON.stringify():', JSON.stringify(testBalance));
    
    console.log('\n✅ Debug complete!');
    console.log('\n🔧 If balance shows as 000000:');
    console.log('   1. Check browser console for JavaScript errors');
    console.log('   2. Clear browser localStorage and refresh');
    console.log('   3. Check if balance is being overwritten somewhere');
    console.log('   4. Verify the correct user is being loaded');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugFounderBalance();