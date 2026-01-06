#!/usr/bin/env node
/**
 * Login Issues Diagnostic Script
 * Checks for common login page and MetaMask disconnect issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing login page and MetaMask issues...\n');

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} - MISSING`);
    return false;
  }
}

function checkFileContent(filePath, searchText, description) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchText)) {
      console.log(`✅ ${description}: Found in ${filePath}`);
      return true;
    } else {
      console.log(`⚠️ ${description}: Not found in ${filePath}`);
      return false;
    }
  } else {
    console.log(`❌ ${description}: ${filePath} does not exist`);
    return false;
  }
}

// Check essential files
console.log('📁 Checking essential files:');
checkFile('components/Auth.tsx', 'Auth Component');
checkFile('services/walletConnector.ts', 'Wallet Connector Service');
checkFile('components/WalletConnector.tsx', 'Wallet Connector Component');
checkFile('index.html', 'Main HTML file');
checkFile('index.css', 'Main CSS file');
checkFile('App.tsx', 'Main App component');

console.log('\n🔧 Checking component functionality:');

// Check Auth component functionality
checkFileContent('components/Auth.tsx', 'onLogin', 'Auth onLogin prop');
checkFileContent('components/Auth.tsx', 'useState', 'Auth state management');
checkFileContent('components/Auth.tsx', 'handleAuth', 'Auth form handler');

// Check wallet disconnect functionality
checkFileContent('services/walletConnector.ts', 'disconnect', 'Wallet disconnect method');
checkFileContent('services/walletConnector.ts', 'wallet_revokePermissions', 'MetaMask permission revocation');
checkFileContent('components/WalletConnector.tsx', 'handleDisconnect', 'UI disconnect handler');

console.log('\n🎨 Checking styling and CSS:');

// Check CSS and styling
checkFileContent('index.html', 'tailwindcss', 'Tailwind CSS CDN');
checkFileContent('index.html', 'Space Grotesk', 'Font loading');
checkFileContent('index.css', '@tailwind', 'Tailwind directives');
checkFileContent('index.css', 'animate-shake', 'Custom animations');

console.log('\n🔐 Checking authentication flow:');

// Check authentication integration
checkFileContent('App.tsx', 'handleLogin', 'Login handler in App');
checkFileContent('App.tsx', 'Auth onLogin', 'Auth component integration');
checkFileContent('App.tsx', 'currentUser', 'User state management');

console.log('\n📊 Checking database integration:');

// Check database functionality
checkFile('services/db.ts', 'Database service');
checkFile('services/productionDatabase.ts', 'Production database service');
checkFileContent('services/db.ts', 'getUserByIdentifier', 'User lookup function');
checkFileContent('services/db.ts', 'hashSecret', 'Password hashing');

console.log('\n🌐 Checking development server:');

// Check if development server files exist
checkFile('vite.config.ts', 'Vite configuration');
checkFile('package.json', 'Package configuration');

// Check package.json scripts
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.scripts && packageJson.scripts.dev) {
    console.log('✅ Development server script: npm run dev');
  } else {
    console.log('❌ Development server script: Missing in package.json');
  }
}

console.log('\n🔍 Common Issues Checklist:');

const issues = [];

// Check for common issues
if (!fs.existsSync('index.css')) {
  issues.push('Missing index.css file (can cause styling issues)');
}

if (!checkFileContent('services/walletConnector.ts', 'removeAllListeners', false)) {
  issues.push('MetaMask event listeners may not be properly removed on disconnect');
}

if (!checkFileContent('components/Auth.tsx', 'min-h-screen', false)) {
  issues.push('Auth component may not have proper full-screen styling');
}

if (!checkFileContent('index.html', '/index.css', false)) {
  issues.push('CSS file not properly linked in HTML');
}

if (issues.length === 0) {
  console.log('✅ No common issues detected');
} else {
  console.log('⚠️ Potential issues found:');
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
}

console.log('\n🚀 Recommended Actions:');
console.log('1. Ensure development server is running: npm run dev');
console.log('2. Check browser console for JavaScript errors');
console.log('3. Verify MetaMask extension is installed and enabled');
console.log('4. Test with founder credentials: Freedom24/7365 / Security Code: 77777');
console.log('5. Clear browser cache and localStorage if issues persist');

console.log('\n📋 Quick Test Commands:');
console.log('• Test build: npm run build');
console.log('• Start dev server: npm run dev');
console.log('• Test production setup: npm run test:production-setup');
console.log('• Open test page: Open test-login.html in browser');

console.log('\n✅ Diagnostic complete!');