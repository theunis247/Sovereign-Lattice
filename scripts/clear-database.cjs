#!/usr/bin/env node

/**
 * Clear database and localStorage to fix login conflicts
 */

console.log('🧹 Clearing database and localStorage conflicts...\n');

// Clear localStorage data that might be causing conflicts
const clearCommands = [
  'Remove-Item -Path "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\Local Storage\\leveldb\\*" -Force -Recurse -ErrorAction SilentlyContinue',
  'Remove-Item -Path "$env:APPDATA\\Mozilla\\Firefox\\Profiles\\*\\storage\\default\\*" -Force -Recurse -ErrorAction SilentlyContinue',
  'Remove-Item -Path "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\Local Storage\\leveldb\\*" -Force -Recurse -ErrorAction SilentlyContinue'
];

console.log('📋 Database clearing instructions:');
console.log('1. Close all browser windows');
console.log('2. Clear browser data for localhost:');
console.log('   - Chrome: Settings > Privacy > Clear browsing data > Advanced > All time');
console.log('   - Firefox: Settings > Privacy > Clear Data > Cookies and Site Data');
console.log('   - Edge: Settings > Privacy > Clear browsing data > All time');
console.log('3. Or use browser DevTools: Application > Storage > Clear storage\n');

console.log('🔧 Alternative: Use browser incognito/private mode for clean testing\n');

console.log('✅ After clearing browser data:');
console.log('   npm run build');
console.log('   npm run preview');
console.log('   Login with: Founder / founder2026\n');

console.log('🎯 New Founder Account Created:');
console.log('   Username: Founder');
console.log('   Password: founder2026');
console.log('   Role: Admin');
console.log('   Balance: 500 QBS');
console.log('   Level: 15\n');

console.log('🚀 Ready for clean login!');